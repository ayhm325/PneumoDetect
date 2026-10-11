import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader, random_split
from sklearn.metrics import accuracy_score, confusion_matrix
import numpy as np
import os
import random
from torch.nn.functional import normalize, cosine_similarity

# =====================
# Settings
# =====================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset")

BATCH_SIZE = 16
EPOCHS = 25
NUM_CLASSES = 2
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
SEED = 42

torch.manual_seed(SEED)
np.random.seed(SEED)
random.seed(SEED)

# =====================
# Transforms (X-ray friendly)
# =====================
train_transform = transforms.Compose([
    transforms.Resize((256, 256)),
    transforms.CenterCrop(224),
    transforms.Grayscale(num_output_channels=3),
    transforms.RandomHorizontalFlip(p=0.5),
    transforms.RandomRotation(10),
    transforms.RandomAffine(10, translate=(0.05, 0.05)),
    transforms.ToTensor(),
    transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])
])

test_transform = transforms.Compose([
    transforms.Resize((256,256)),
    transforms.CenterCrop(224),
    transforms.Grayscale(num_output_channels=3),
    transforms.ToTensor(),
    transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])
])

# =====================
# Dataset
# =====================
full_train = datasets.ImageFolder(os.path.join(DATASET_DIR, "train"), transform=train_transform)
train_size = int(0.85 * len(full_train))
val_size = len(full_train) - train_size
train_data, val_data = random_split(full_train, [train_size, val_size])
test_data = datasets.ImageFolder(os.path.join(DATASET_DIR, "test"), transform=test_transform)

# =====================
# Class Weights
# =====================
class_counts = np.bincount(full_train.targets)
class_weights = torch.tensor(1.0 / class_counts, dtype=torch.float).to(DEVICE)

# =====================
# Focal Loss
# =====================
class FocalLoss(nn.Module):
    def __init__(self, gamma=2, smoothing=0.1):
        super().__init__()
        self.gamma = gamma
        self.ce = nn.CrossEntropyLoss(weight=class_weights, label_smoothing=smoothing)

    def forward(self, logits, targets):
        ce_loss = self.ce(logits, targets)
        pt = torch.exp(-ce_loss)
        return ((1 - pt) ** self.gamma * ce_loss)

criterion = FocalLoss()

# =====================
# Models
# =====================
def build_model(name):
    if name == "densenet121":
        model = models.densenet121(weights="IMAGENET1K_V1")
        for p in model.features.parameters():
            p.requires_grad = False
        model.classifier = nn.Linear(model.classifier.in_features, NUM_CLASSES)

    elif name == "efficientnet_b0":
        model = models.efficientnet_b0(weights="IMAGENET1K_V1")
        for p in model.features.parameters():
            p.requires_grad = False
        model.classifier[1] = nn.Linear(model.classifier[1].in_features, NUM_CLASSES)

    return model.to(DEVICE)

models_dict = {
    "densenet": build_model("densenet121"),
    "efficientnet": build_model("efficientnet_b0")
}

# =====================
# Optimizers + Scheduler
# =====================
optimizers = {
    k: optim.Adam(filter(lambda p: p.requires_grad, m.parameters()), lr=1e-4)
    for k, m in models_dict.items()
}

schedulers = {
    k: optim.lr_scheduler.ReduceLROnPlateau(opt, mode="min", patience=3)
    for k, opt in optimizers.items()
}

scaler = torch.amp.GradScaler(enabled=(DEVICE=="cuda"))

# =====================
# Training
# =====================
def train_model(name, model, optimizer, scheduler, train_loader, val_loader):
    best_acc = 0
    patience, wait = 5, 0

    for epoch in range(EPOCHS):
        model.train()
        losses = []

        for x, y in train_loader:
            x, y = x.to(DEVICE), y.to(DEVICE)
            optimizer.zero_grad()

            with torch.amp.autocast(device_type=DEVICE):
                out = model(x)
                loss = criterion(out, y)

            scaler.scale(loss).backward()
            scaler.unscale_(optimizer)
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            scaler.step(optimizer)
            scaler.update()

            losses.append(loss.item())

        model.eval()
        y_true, y_pred = [], []
        with torch.no_grad():
            for x, y in val_loader:
                x, y = x.to(DEVICE), y.to(DEVICE)
                preds = model(x).argmax(dim=1)
                y_true.extend(y.cpu().numpy())
                y_pred.extend(preds.cpu().numpy())

        val_acc = accuracy_score(y_true, y_pred)
        scheduler.step(np.mean(losses))

        print(f"[{name}] Epoch {epoch+1} | Loss {np.mean(losses):.4f} | Val Acc {val_acc:.4f}")

        if val_acc > best_acc:
            best_acc = val_acc
            torch.save(model.state_dict(), f"best_{name}.pth")
            wait = 0
        else:
            wait += 1
            if wait >= patience:
                print(f"Early stopping {name}")
                break

# =====================
# Feature Centroids (Per Class)
# =====================
def compute_class_centroids(model, loader):
    model.eval()
    feats = {0: [], 1: []}

    with torch.no_grad():
        for x, y in loader:
            x, y = x.to(DEVICE), y.to(DEVICE)
            f = normalize(torch.flatten(model.features(x), 1), dim=1)
            for cls in [0,1]:
                feats[cls].append(f[y == cls])

    return {
        cls: normalize(torch.cat(v).mean(dim=0, keepdim=True), dim=1)
        for cls, v in feats.items()
    }

# =====================
# Inference (Ensemble + OOD) – UI Ready
# =====================
def infer(image, models_dict, centroids, conf_th=0.6, sim_th=0.7):
    image = image.unsqueeze(0).to(DEVICE)
    probs, feats = [], []

    for model in models_dict.values():
        model.eval()
        with torch.no_grad():
            out = model(image)
            probs.append(torch.softmax(out, dim=1))
            feats.append(normalize(torch.flatten(model.features(image),1), dim=1))

    avg_prob = torch.mean(torch.stack(probs), dim=0)
    confidence, pred_class = torch.max(avg_prob, dim=1)

    if confidence.item() < conf_th:
        return {
            "status": "low_confidence",
            "label": "⚠️ Not a chest X-ray",
            "confidence": confidence.item()
        }

    feat_avg = torch.mean(torch.stack(feats), dim=0)
    similarity = cosine_similarity(feat_avg, centroids[pred_class.item()])

    if similarity.item() < sim_th:
        return {
            "status": "ood",
            "label": "⚠️ Possibly another chest disease",
            "confidence": confidence.item()
        }

    return {
        "status": "ok",
        "label": "Normal" if pred_class.item() == 0 else "Pneumonia",
        "confidence": confidence.item()
    }

# =====================
# Main
# =====================
if __name__ == "__main__":
    train_loader = DataLoader(train_data, BATCH_SIZE, shuffle=True)
    val_loader = DataLoader(val_data, BATCH_SIZE)
    test_loader = DataLoader(test_data, BATCH_SIZE)

    for name, model in models_dict.items():
        train_model(name, model, optimizers[name], schedulers[name], train_loader, val_loader)

    centroids = compute_class_centroids(models_dict["densenet"], train_loader)

    y_true, y_pred = [], []
    for x, y in test_loader:
        for i in range(x.size(0)):
            result = infer(x[i], models_dict, centroids)
            if result["status"] == "ok":
                y_true.append(y[i].item())
                y_pred.append(0 if result["label"] == "Normal" else 1)

    print("Confusion Matrix:")
    print(confusion_matrix(y_true, y_pred))
    print("Accuracy:", accuracy_score(y_true, y_pred))