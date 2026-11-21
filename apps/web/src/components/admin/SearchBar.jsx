import Input from "@/app/components/ui/Input";
import { useTranslations } from "@/lib/compat/intl";

export default function SearchBar({ value, onChange, placeholder }) {
  const t = useTranslations("adminCommon");
  const searchPlaceholder = placeholder || t("searchPlaceholder");
  return (
    <div className="my-2">
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={searchPlaceholder}
      />
    </div>
  );
}
