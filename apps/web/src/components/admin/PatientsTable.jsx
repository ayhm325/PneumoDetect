import dynamic from "next/dynamic";

const PatientsTableClient = dynamic(() => import("./PatientsTable.client"), {
  ssr: false,
});

export default function PatientsTable(props) {
  return <PatientsTableClient {...props} />;
}
