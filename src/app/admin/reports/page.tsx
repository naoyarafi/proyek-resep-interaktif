// src/app/admin/reports/page.tsx

import dbConnect from "@/lib/dbConnect";
import Report from "@/models/Report.model";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  Box,
  Button,
} from "@mui/material";
import Link from "next/link";
import ReportActionButtons from "@/components/admin/ReportActionButtons";

async function getReports() {
  await dbConnect();
  const reports = await Report.find({})
    .sort({ createdAt: -1 })
    .populate("recipe", "title")
    .populate("reportingUser", "name email");
  return JSON.parse(JSON.stringify(reports));
}

export default async function AdminReportsPage() {
  const reports = await getReports();

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Daftar Laporan Resep
      </Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Judul Resep</TableCell>
              <TableCell>Dilaporkan Oleh</TableCell>
              <TableCell>Alasan</TableCell>
              <TableCell>Tanggal</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {reports.map((report: any) => (
              <TableRow key={report._id}>
                <TableCell>
                  {report.recipe ? (
                    <Link
                      href={`/recipes/${report.recipe._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {" "}
                      {report.recipe.title}
                    </Link>
                  ) : (
                    "Resep telah dihapus"
                  )}
                </TableCell>
                <TableCell>
                  {report.reportingUser?.name || "User telah dihapus"}
                </TableCell>
                <TableCell sx={{ maxWidth: 300, whiteSpace: "pre-wrap" }}>
                  {report.reason}
                </TableCell>
                <TableCell>
                  {new Date(report.createdAt).toLocaleDateString("id-ID")}
                </TableCell>
                <TableCell>
                  <Chip
                    label={report.status}
                    color={report.status === "pending" ? "warning" : "success"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <ReportActionButtons report={report} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
