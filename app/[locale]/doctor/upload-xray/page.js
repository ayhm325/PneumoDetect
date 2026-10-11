import DoctorLayout from "../DoctorLayout";
import UploadXRayPageContent from "../../../components/doctor/pages/UploadXRayPageContent";

export default function UploadXRayPage() {
  return (
    <DoctorLayout>
      <div className="min-h-screen bg-[var(--ui-surface)] text-[var(--ui-foreground)]">
        <UploadXRayPageContent />
      </div>
    </DoctorLayout>
  );
}
