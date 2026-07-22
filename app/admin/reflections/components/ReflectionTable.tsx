import type { Reflection } from "@/app/lib/reflection/reflection-types";

import DataTable from "@/app/admin/components/ui/table/DataTable";
import TableHead from "@/app/admin/components/ui/table/TableHead";
import TableHeader from "@/app/admin/components/ui/table/TableHeader";
import TableBody from "@/app/admin/components/ui/table/TableBody";
import TableRow from "@/app/admin/components/ui/table/TableRow";
import TableCell from "@/app/admin/components/ui/table/TableCell";

import AuthorCell from "@/app/admin/components/ui/table/cells/AuthorCell";
import DateCell from "@/app/admin/components/ui/table/cells/DateCell";
import StatusCell from "@/app/admin/components/ui/table/cells/StatusCell";

import ReflectionModerationActions from "./ReflectionModerationActions";

interface Props {
  reflections: Reflection[];
}

export default function ReflectionTable({
  reflections,
}: Props) {
  return (
    <DataTable>

      <TableHead>

        <TableHeader>
          Question
        </TableHeader>

        <TableHeader>
          Author
        </TableHeader>

        <TableHeader>
          Status
        </TableHeader>

        <TableHeader>
          Created
        </TableHeader>

        <TableHeader align="right">
          Actions
        </TableHeader>

      </TableHead>

      <TableBody>

        {reflections.map((reflection) => (

          <TableRow key={reflection.id}>

            <TableCell>
              <div>

                <p className="font-medium text-slate-900 dark:text-white">
                  {reflection.question}
                </p>

                <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                  {reflection.content}
                </p>

              </div>
            </TableCell>

            <TableCell>
              <AuthorCell
                name={reflection.authorName}
              />
            </TableCell>

            <TableCell>
              <StatusCell
                status={reflection.status}
              />
            </TableCell>

            <TableCell>
              <DateCell
                date={reflection.createdAt}
              />
            </TableCell>

            <TableCell align="right">
              <ReflectionModerationActions
                reflectionId={reflection.id}
              />
            </TableCell>

          </TableRow>

        ))}

      </TableBody>

    </DataTable>
  );
}