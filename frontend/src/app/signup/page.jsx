"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Alert from "@mui/material/Alert";
import Link from "@mui/material/Link";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import BrandLogo from "@/components/BrandLogo";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import BadgeIcon from "@mui/icons-material/Badge";
import WorkIcon from "@mui/icons-material/Work";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import CircularProgress from "@mui/material/CircularProgress";
import InputAdornment from "@mui/material/InputAdornment";
import { apiFetch } from "@/lib/api";
import { useLanguage } from "@/lib/language-context";
import LanguageToggle from "@/components/LanguageToggle";
import SiteFooter from "@/components/SiteFooter";

export default function SignupPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const S = t.auth.signup;
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    account_category: "",
    full_name: "",
    email: "",
    student_registration_number: "",
    role: "student_services",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Validation states
  const [emailValidation, setEmailValidation] = useState({ status: "idle", message: "" });
  const [studentIdValidation, setStudentIdValidation] = useState({ status: "idle", message: "" });
  const [passwordMatch, setPasswordMatch] = useState({ status: "idle", message: "" });
  const [validatingEmail, setValidatingEmail] = useState(false);
  const [validatingStudentId, setValidatingStudentId] = useState(false);
  const [fetchedFullName, setFetchedFullName] = useState("");

  // Validate email with debounce
  const validateEmail = useCallback(async (email) => {
    if (!email || !email.includes("@")) {
      setEmailValidation({ status: "idle", message: "" });
      return;
    }

    setValidatingEmail(true);
    try {
      const response = await apiFetch(`/auth/validate-email/${encodeURIComponent(email)}`);
      
      if (response.valid && response.available) {
        setEmailValidation({ 
          status: "success", 
          message: response.student_found ? `Verified - ${response.student_name}` : (response.institution_name ? `Valid - ${response.institution_name}` : "Email is valid")
        });
        
        // Set full name if student found
        if (response.student_found && response.student_name) {
          setFetchedFullName(response.student_name);
          setFormData(prev => ({ ...prev, full_name: response.student_name }));
        }
      } else {
        setEmailValidation({ 
          status: "error", 
          message: response.message 
        });
        setFetchedFullName("");
      }
    } catch (err) {
      setEmailValidation({ status: "error", message: "Failed to validate email" });
      setFetchedFullName("");
    } finally {
      setValidatingEmail(false);
    }
  }, []);

  // Validate student ID
  const validateStudentId = useCallback(async (studentId) => {
    if (!studentId || studentId.length < 6) {
      setStudentIdValidation({ status: "idle", message: "" });
      setFetchedFullName("");
      setFormData(prev => ({ ...prev, email: "", full_name: "" }));
      return;
    }

    setValidatingStudentId(true);
    try {
      const response = await apiFetch(`/auth/validate-student-id/${encodeURIComponent(studentId)}`);
      
      if (response.valid && response.available) {
        setStudentIdValidation({ 
          status: "success", 
          message: response.student_name ? `Verified - ${response.student_name}` : "Student ID is valid"
        });
        
        // Set both email and full name from response
        if (response.student_name) {
          setFetchedFullName(response.student_name);
          setFormData(prev => ({ 
            ...prev, 
            full_name: response.student_name,
            email: response.student_email || prev.email
          }));
        }
      } else {
        setStudentIdValidation({ status: "error", message: response.message });
        setFetchedFullName("");
        setFormData(prev => ({ ...prev, email: "", full_name: "" }));
      }
    } catch (err) {
      setStudentIdValidation({ status: "error", message: "Failed to validate student ID" });
      setFetchedFullName("");
      setFormData(prev => ({ ...prev, email: "", full_name: "" }));
    } finally {
      setValidatingStudentId(false);
    }
  }, []);

  // Check password match
  useEffect(() => {
    if (formData.password && formData.confirmPassword) {
      if (formData.password === formData.confirmPassword) {
        setPasswordMatch({ status: "success", message: "Passwords match" });
      } else {
        setPasswordMatch({ status: "error", message: "Passwords do not match" });
      }
    } else {
      setPasswordMatch({ status: "idle", message: "" });
    }
  }, [formData.password, formData.confirmPassword]);

  // Debounced email validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.email) {
        validateEmail(formData.email);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.email, validateEmail]);

  // Debounced student ID validation
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.student_registration_number && formData.account_category === "student") {
        validateStudentId(formData.student_registration_number);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.student_registration_number, formData.account_category, validateStudentId]);

  // Helper to render validation icon
  const getValidationIcon = (validation, isValidating) => {
    if (isValidating) {
      return <CircularProgress size={20} />;
    }
    if (validation.status === "success") {
      return <CheckCircleIcon sx={{ color: "success.main" }} />;
    }
    if (validation.status === "error") {
      return <CancelIcon sx={{ color: "error.main" }} />;
    }
    return null;
  };

  const handleNext = () => {
    setError("");
    
    if (activeStep === 0 && !formData.account_category) {
      setError(S.errors.selectAccountType);
      return;
    }

    if (activeStep === 1) {
      if (formData.account_category === "student") {
        if (!formData.student_registration_number) {
          setError(S.errors.enterStudentId);
          return;
        }

        if (studentIdValidation.status !== "success") {
          setError(S.errors.invalidStudentId);
          return;
        }

        if (!formData.email || !formData.full_name || !fetchedFullName) {
          setError(S.errors.studentInfoNotVerified);
          return;
        }
      } else {
        if (!formData.full_name || !formData.email) {
          setError(S.errors.fillRequiredFields);
          return;
        }

        if (emailValidation.status !== "success") {
          setError(S.errors.invalidInstitutionalEmail);
          return;
        }
      }
    }
    
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setError("");
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (emailValidation.status !== "success") {
      setError(S.errors.useValidEmail);
      return;
    }

    if (formData.account_category === "student" && studentIdValidation.status !== "success") {
      setError(S.errors.invalidStudentId);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(S.errors.passwordsNoMatch);
      return;
    }

    if (formData.password.length < 6) {
      setError(S.errors.passwordTooShort);
      return;
    }

    if (formData.account_category === "student" && !formData.student_registration_number) {
      setError(S.errors.studentIdRequired);
      return;
    }

    setLoading(true);

    try {
      await apiFetch("/auth/signup", {
        method: "POST",
        body: {
          email: formData.email,
          password: formData.password,
          full_name: formData.full_name,
          role: formData.account_category === "student" ? "student" : formData.role,
          account_category: formData.account_category,
          student_registration_number: formData.account_category === "student" ? formData.student_registration_number : null,
        },
      });
      
      // Students are auto-verified, redirect to login
      // Staff need email verification
      if (formData.account_category === "student") {
        router.push(`/login?registered=true&email=${encodeURIComponent(formData.email)}`);
      } else {
        router.push(`/verify-email?email=${encodeURIComponent(formData.email)}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : S.errors.failedToCreate);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom fontWeight={600} textAlign="center" mb={3}>
              {S.step0.heading}
            </Typography>
            <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}>
              <Card 
                sx={{ 
                  flex: 1,
                  border: formData.account_category === "student" ? 2 : 1,
                  borderColor: formData.account_category === "student" ? "primary.main" : "grey.300",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: 3,
                  }
                }}
              >
                <CardActionArea onClick={() => setFormData({ ...formData, account_category: "student" })}>
                  <CardContent sx={{ textAlign: "center", py: 4 }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        bgcolor: formData.account_category === "student" ? "primary.main" : "grey.200",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mx: "auto",
                        mb: 2,
                        transition: "all 0.2s",
                      }}
                    >
                      <AccountCircleIcon 
                        sx={{ 
                          fontSize: 32, 
                          color: formData.account_category === "student" ? "white" : "grey.600" 
                        }} 
                      />
                    </Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {S.step0.studentTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {S.step0.studentDesc}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>

              <Card 
                sx={{ 
                  flex: 1,
                  border: formData.account_category === "staff" ? 2 : 1,
                  borderColor: formData.account_category === "staff" ? "primary.main" : "grey.300",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: "primary.main",
                    boxShadow: 3,
                  }
                }}
              >
                <CardActionArea onClick={() => setFormData({ ...formData, account_category: "staff" })}>
                  <CardContent sx={{ textAlign: "center", py: 4 }}>
                    <Box
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: "50%",
                        bgcolor: formData.account_category === "staff" ? "primary.main" : "grey.200",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        mx: "auto",
                        mb: 2,
                        transition: "all 0.2s",
                      }}
                    >
                      <WorkIcon 
                        sx={{ 
                          fontSize: 32, 
                          color: formData.account_category === "staff" ? "white" : "grey.600" 
                        }} 
                      />
                    </Box>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      {S.step0.staffTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {S.step0.staffDesc}
                    </Typography>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Box>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom fontWeight={600} mb={3}>
              {S.step1.heading}
            </Typography>

            {formData.account_category === "student" && (
              <>
                <TextField
                  fullWidth
                  label={S.step1.studentIdLabel}
                  value={formData.student_registration_number}
                  onChange={(e) => setFormData({ ...formData, student_registration_number: e.target.value })}
                  helperText={studentIdValidation.message || S.step1.studentIdHelper}
                  required
                  error={studentIdValidation.status === "error"}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: <BadgeIcon sx={{ mr: 1, color: "text.secondary" }} />,
                    endAdornment: (
                      <InputAdornment position="end">
                        {getValidationIcon(studentIdValidation, validatingStudentId)}
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label={S.step1.emailLabel}
                  type="email"
                  value={formData.email}
                  disabled
                  helperText={formData.email ? S.step1.emailAutoFilled : S.step1.emailAutoFillPending}
                  sx={{ mb: 2 }}
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  fullWidth
                  label={S.step1.fullNameLabel}
                  value={formData.full_name}
                  disabled
                  helperText={fetchedFullName ? S.step1.fullNameAutoFilled : S.step1.fullNameAutoFillPending}
                  sx={{ mb: 2 }}
                  InputProps={{ readOnly: true }}
                />
              </>
            )}

            {formData.account_category === "staff" && (
              <>
                <TextField
                  fullWidth
                  label={S.step1.emailLabel}
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  helperText={emailValidation.message || S.step1.emailHelper}
                  required
                  error={emailValidation.status === "error"}
                  sx={{ mb: 2 }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        {getValidationIcon(emailValidation, validatingEmail)}
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  fullWidth
                  label={S.step1.fullNameLabel}
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                  sx={{ mb: 2 }}
                />
              </>
            )}

            {formData.account_category === "staff" && (
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>{S.step1.roleLabel}</InputLabel>
                <Select
                  value={formData.role}
                  label={S.step1.roleLabel}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                >
                  <MenuItem value="registrar">{S.step1.roles.registrar}</MenuItem>
                  <MenuItem value="scholarship_office">{S.step1.roles.scholarship_office}</MenuItem>
                  <MenuItem value="student_services">{S.step1.roles.student_services}</MenuItem>
                  <MenuItem value="research_office">{S.step1.roles.research_office}</MenuItem>
                  <MenuItem value="vice_chancellor">{S.step1.roles.vice_chancellor}</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom fontWeight={600} mb={3}>
              {S.step2.heading}
            </Typography>
            <TextField
              fullWidth
              label={S.step2.passwordLabel}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              helperText={S.step2.passwordHelper}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label={S.step2.confirmPasswordLabel}
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              helperText={passwordMatch.message || S.step2.confirmPasswordHelper}
              required
              error={passwordMatch.status === "error"}
              sx={{ mb: 3 }}
              InputProps={{
                endAdornment: formData.confirmPassword && (
                  <InputAdornment position="end">
                    {getValidationIcon(passwordMatch, false)}
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ bgcolor: "grey.50", p: 2, borderRadius: 1, mb: 2 }}>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                {S.step2.summaryTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>{S.step2.summaryType}</strong> {formData.account_category === "student" ? S.step2.studentType : S.step2.staffType}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>{S.step2.summaryName}</strong> {formData.full_name}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                <strong>{S.step2.summaryEmail}</strong> {formData.email}
              </Typography>
              {formData.account_category === "student" && (
                <Typography variant="body2" color="text.secondary">
                  <strong>{S.step2.summaryRegNumber}</strong> {formData.student_registration_number}
                </Typography>
              )}
              {formData.account_category === "staff" && (
                <Typography variant="body2" color="text.secondary">
                  <strong>{S.step2.summaryDepartment}</strong> {formData.role.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())}
                </Typography>
              )}
            </Box>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default", display: "flex", flexDirection: "column" }}>
      <AppBar position="static" color="default" elevation={1}>
        <Toolbar sx={{ minHeight: 88, py: 1.5, px: { xs: 2, sm: 3 }, justifyContent: "space-between" }}>
          <BrandLogo height={64} format="png" onClick={() => router.push("/")} />
          <LanguageToggle />
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ flex: 1, display: "flex", alignItems: "center", py: 4 }}>
        <Paper sx={{ p: 4, width: "100%", boxShadow: 3 }}>
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                bgcolor: "primary.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
              }}
            >
              <PersonAddIcon sx={{ fontSize: 30, color: "white" }} />
            </Box>
            <Typography variant="h5" fontWeight={700} gutterBottom>
              {S.title}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {S.subtitle}
            </Typography>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {S.steps.map((label) => (
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

          <form onSubmit={handleSubmit}>
            {renderStepContent(activeStep)}

            <Box sx={{ display: "flex", gap: 2, mt: 4 }}>
              <Button disabled={activeStep === 0} onClick={handleBack} variant="outlined" sx={{ flex: 1 }}>
                {t.common.back}
              </Button>
              {activeStep === S.steps.length - 1 ? (
                <Button type="submit" variant="contained" disabled={loading} sx={{ flex: 1 }}>
                  {loading ? S.step2.creatingBtn : S.step2.createBtn}
                </Button>
              ) : (
                <Button onClick={handleNext} variant="contained" sx={{ flex: 1 }}>
                  {t.common.next}
                </Button>
              )}
            </Box>
          </form>

          <Box sx={{ textAlign: "center", mt: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {S.alreadyHaveAccount}{" "}
              <Link component="button" variant="body2" onClick={() => router.push("/login")} sx={{ fontWeight: 600, cursor: "pointer" }}>
                {S.signInLink}
              </Link>
            </Typography>
          </Box>

          <Box sx={{ textAlign: "center", mt: 2, pt: 2, borderTop: "1px solid", borderColor: "grey.200" }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
              {S.adminAccess}
            </Typography>
            <Box sx={{ display: "flex", gap: 1, justifyContent: "center" }}>
              <Link component="button" variant="caption" onClick={() => router.push("/global-admin/login")} sx={{ cursor: "pointer" }}>
                {S.globalAdmin}
              </Link>
              <Typography variant="caption" color="text.secondary">•</Typography>
              <Link component="button" variant="caption" onClick={() => router.push("/institution/login")} sx={{ cursor: "pointer" }}>
                {S.institutionAdmin}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Container>

      <SiteFooter showLegal={false} />
    </Box>
  );
}
