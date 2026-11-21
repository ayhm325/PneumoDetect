"use client";

import { FaUserInjured, FaUserPlus } from "react-icons/fa";
import Button from "../ui/Button";
import { Table, THead, TRow, TH, TD } from "../ui/Table";
import Pagination from "../ui/Pagination";
import { useTranslations } from "@/lib/compat/intl";

export default function PatientsTableClient({
  patients,
  onEdit,
  onDelete,
  onDetails,
  onAdd,
  page = 1,
  pageCount = 1,
  onPageChange,
}) {
  const tPatients = useTranslations("adminPatients");
  const thName = tPatients("PatientsManagement.csvHeader_name");
  const thAge = tPatients("PatientsManagement.labels.age");
  const thEmail = tPatients("PatientsManagement.csvHeader_email");
  const thActions = tPatients("PatientsManagement.table.actions");
  const editLabel = tPatients("PatientsManagement.actions.edit");
  const deleteLabel = tPatients("PatientsManagement.actions.delete");
  const detailsLabel = tPatients("PatientsManagement.actions.details");
  const addLabel = tPatients("PatientsManagement.addButton");

  return (
    <div className="mt-8">
      <Table>
        <THead>
          <TRow className="bg-(--ui-surface-2)">
            <TH>#</TH>
            <TH>{thName}</TH>
            <TH>{thAge}</TH>
            <TH>{thEmail}</TH>
            <TH>{thActions}</TH>
          </TRow>
        </THead>
        <tbody>
          {patients.map((patient, i) => (
            <TRow key={patient.id} className="hover:bg-(--ui-surface-2)/60">
              <TD className="text-center font-bold">{i + 1}</TD>
              <TD className="text-center">
                <span className="inline-flex items-center gap-2 justify-center">
                  <FaUserInjured className="text-(--ui-muted-foreground)" />
                  {patient.name}
                </span>
              </TD>
              <TD className="text-center">{patient.age}</TD>
              <TD className="text-center">{patient.email}</TD>
              <TD>
                <div className="flex items-center justify-center gap-2">
                  <Button
                    variant="ghost"
                    className="px-3 py-2"
                    title={editLabel}
                    onClick={() => onEdit && onEdit(patient)}
                  >
                    {editLabel}
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-3 py-2 text-(--ui-danger)"
                    title={deleteLabel}
                    onClick={() => onDelete && onDelete(patient)}
                  >
                    {deleteLabel}
                  </Button>
                  <Button
                    variant="ghost"
                    className="px-3 py-2 text-(--ui-info)"
                    title={detailsLabel}
                    onClick={() => onDetails && onDetails(patient)}
                  >
                    {detailsLabel}
                  </Button>
                </div>
              </TD>
            </TRow>
          ))}
        </tbody>
      </Table>

      <div className="flex items-center justify-between mt-6">
        <Button
          variant="primary"
          className="px-6"
          onClick={() => onAdd && onAdd()}
        >
          <span className="inline-flex items-center gap-2">
            <FaUserPlus /> {addLabel}
          </span>
        </Button>
        <Pagination
          page={page}
          pageCount={pageCount}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
}