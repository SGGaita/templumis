"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Alert from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import LinearProgress from "@mui/material/LinearProgress";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import DownloadIcon from "@mui/icons-material/Download";
import { apiFetch } from "@/lib/api";

const steps = ["Upload CSV", "Validate Data", "Review & Import"];

export default function ImportStudentsPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [validationResults, setValidationResults] = useState(null);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setError("");
    } else {
      setError("Please select a valid CSV file");
      setFile(null);
    }
  };

  const handleValidate = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setError("");
    // TODO: Replace with actual API call
    // Simulate validation
    setTimeout(() => {
      setValidationResults({
        totalRows: 150,
        validRows: 145,
        invalidRows: 5,
        errors: [
          { row: 12, field: "email", message: "Invalid email format" },
          { row: 34, field: "student_number", message: "Duplicate student number" },
          { row: 67, field: "gpa", message: "GPA must be between 0 and 4" },
          { row: 89, field: "program", message: "Program not found" },
          { row: 123, field: "enrollment_date", message: "Invalid date format" },
        ],
      });
      setActiveStep(1);
    }, 1500);
  };

  const handleImport = async () => {
    setImporting(true);
    setError("");

    try {
      // TODO: Replace with actual API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setActiveStep(2);
    } catch (err) {
      setError("Failed to import students. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    // Create CSV template
    const headers = [
      "student_number",
      "full_name",
      "email",
      "phone",
      "program",
      "cohort",
      "enrollment_date",
      "gpa",
      "credits_completed",
    ];
    const csvContent = headers.join(",") + "\n" + "STU001,John Doe,john@university.edu,+1234567890,Computer Science,2021,2021-09-01,3.75,90";
    
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "student_import_template.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => router.push("/staff/enrollment")}
        sx={{ mb: 2 }}
      >
        Back to Students
      </Button>

      <Typography variant="h4" gutterBottom fontWeight={700}>
        Import Students
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Bulk import student records from CSV file
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {activeStep === 0 && (
          <Box>
            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                <strong>CSV Format Requirements:</strong>
              </Typography>
              <Typography variant="body2" component="div">
                • Required columns: student_number, full_name, email, program, cohort, enrollment_date
                <br />
                • Optional columns: phone, gpa, credits_completed, address, date_of_birth
                <br />
                • Date format: YYYY-MM-DD
                <br />
                • Maximum file size: 10MB
              </Typography>
            </Alert>

            <Box sx={{ textAlign: "center", py: 4, border: "2px dashed", borderColor: "grey.300", borderRadius: 2, mb: 3 }}>
              <CloudUploadIcon sx={{ fontSize: 64, color: "grey.400", mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                {file ? file.name : "Select CSV File"}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Drag and drop or click to browse
              </Typography>
              <Button
                variant="contained"
                component="label"
                sx={{ mt: 2 }}
              >
                Choose File
                <input
                  type="file"
                  hidden
                  accept=".csv"
                  onChange={handleFileChange}
                />
              </Button>
            </Box>

            <Box sx={{ display: "flex", gap: 2, justifyContent: "space-between" }}>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={downloadTemplate}
              >
                Download Template
              </Button>
              <Button
                variant="contained"
                onClick={handleValidate}
                disabled={!file}
              >
                Validate & Continue
              </Button>
            </Box>
          </Box>
        )}

        {activeStep === 1 && validationResults && (
          <Box>
            <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
              <Paper sx={{ p: 2, flex: 1, bgcolor: "success.light" }}>
                <Typography variant="h4" fontWeight={700} color="success.dark">
                  {validationResults.validRows}
                </Typography>
                <Typography variant="body2" color="success.dark">
                  Valid Records
                </Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: 1, bgcolor: "error.light" }}>
                <Typography variant="h4" fontWeight={700} color="error.dark">
                  {validationResults.invalidRows}
                </Typography>
                <Typography variant="body2" color="error.dark">
                  Invalid Records
                </Typography>
              </Paper>
              <Paper sx={{ p: 2, flex: 1, bgcolor: "grey.100" }}>
                <Typography variant="h4" fontWeight={700}>
                  {validationResults.totalRows}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Records
                </Typography>
              </Paper>
            </Box>

            {validationResults.errors.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Alert severity="warning" sx={{ mb: 2 }}>
                  Found {validationResults.errors.length} validation errors. Please fix these issues or continue to import only valid records.
                </Alert>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Row</TableCell>
                        <TableCell>Field</TableCell>
                        <TableCell>Error</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {validationResults.errors.map((error, index) => (
                        <TableRow key={index}>
                          <TableCell>{error.row}</TableCell>
                          <TableCell>{error.field}</TableCell>
                          <TableCell>{error.message}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            <Box sx={{ display: "flex", gap: 2, justifyContent: "space-between" }}>
              <Button onClick={() => setActiveStep(0)}>
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleImport}
                disabled={importing || validationResults.validRows === 0}
              >
                {importing ? "Importing..." : `Import ${validationResults.validRows} Students`}
              </Button>
            </Box>

            {importing && <LinearProgress sx={{ mt: 2 }} />}
          </Box>
        )}

        {activeStep === 2 && (
          <Box sx={{ textAlign: "center", py: 4 }}>
            <CheckCircleIcon sx={{ fontSize: 80, color: "success.main", mb: 2 }} />
            <Typography variant="h5" gutterBottom fontWeight={600}>
              Import Completed Successfully!
            </Typography>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {validationResults?.validRows} students have been imported into the system.
            </Typography>
            <Box sx={{ display: "flex", gap: 2, justifyContent: "center", mt: 4 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setActiveStep(0);
                  setFile(null);
                  setValidationResults(null);
                }}
              >
                Import More
              </Button>
              <Button
                variant="contained"
                onClick={() => router.push("/staff/enrollment")}
              >
                View Students
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
}
