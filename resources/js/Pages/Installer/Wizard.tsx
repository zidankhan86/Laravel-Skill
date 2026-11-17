import React, { useState, useEffect } from "react";
import { Head } from "@inertiajs/react";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Server,
  Database,
  Globe,
  Lock,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  Cpu,
  Layers,
  HelpCircle,
} from "lucide-react";

interface RequirementsData {
  php: {
    current: string;
    minimum: string;
    passed: boolean;
    message: string;
  };
  extensions: {
    required: Record<string, { name: string; loaded: boolean; required: boolean }>;
    optional: Record<string, { name: string; loaded: boolean; required: boolean }>;
    allRequiredPassed: boolean;
  };
  permissions: {
    paths: Record<string, { path: string; writable: boolean; exists: boolean }>;
    allWritable: boolean;
  };
  limits: {
    memory_limit: string;
    max_execution_time: number;
    upload_max_filesize: string;
    post_max_size: string;
  };
  disk: {
    freeMb: number | null;
    sufficient: boolean;
  };
  canProceed: boolean;
}

interface DetectedHosting {
  provider: "hostinger" | "cpanel" | "generic";
  name: string;
  confidence: "high" | "medium" | "low";
  details: string;
}

interface WizardProps {
  requirements: RequirementsData;
  detectedHosting: DetectedHosting;
  state: any;
  defaultAppUrl: string;
  csrf_token: string;
}

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export default function Wizard({
  requirements: initialRequirements,
  detectedHosting,
  defaultAppUrl,
  csrf_token,
}: WizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [requirements, setRequirements] = useState<RequirementsData>(initialRequirements);
  const [checkingReqs, setCheckingReqs] = useState(false);

  // Step 3: Provider selection
  const [provider, setProvider] = useState<"hostinger" | "cpanel" | "generic">(
    detectedHosting.provider || "generic"
  );

  // Step 4: Database Config
  const [dbMode, setDbMode] = useState<"auto" | "manual">(
    detectedHosting.provider === "generic" ? "manual" : "auto"
  );
  // Hostinger API credentials
  const [hostingerToken, setHostingerToken] = useState("");
  const [hostingerWebsiteId, setHostingerWebsiteId] = useState("");
  // cPanel API credentials
  const [cpanelHost, setCpanelHost] = useState("127.0.0.1");
  const [cpanelPort, setCpanelPort] = useState("2083");
  const [cpanelUser, setCpanelUser] = useState("");
  const [cpanelToken, setCpanelToken] = useState("");
  // Database fields
  const [dbHost, setDbHost] = useState("127.0.0.1");
  const [dbPort, setDbPort] = useState("3306");
  const [dbName, setDbName] = useState("portfolio_db");
  const [dbUsername, setDbUsername] = useState("portfolio_usr");
  const [dbPassword, setDbPassword] = useState("");
  const [showDbPassword, setShowDbPassword] = useState(false);

  // Connection testing state
  const [dbTesting, setDbTesting] = useState(false);
  const [dbTestResult, setDbTestResult] = useState<{
    connected: boolean;
    message: string;
    details?: any;
  } | null>(null);

  // Step 5: Website Info
  const [siteName, setSiteName] = useState("Md Tanvir Hossain | eCommerce Architect");
  const [siteUrl, setSiteUrl] = useState(defaultAppUrl || window.location.origin);
  const [adminName, setAdminName] = useState("Md Tanvir Hossain");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordConfirm, setAdminPasswordConfirm] = useState("");
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [timezone, setTimezone] = useState("Asia/Dhaka");

  // Step 6: Installation Execution
  const [installing, setInstalling] = useState(false);
  const [installProgress, setInstallProgress] = useState(0);
  const [activeInstallSubstep, setActiveInstallSubstep] = useState("");
  const [installLogs, setInstallLogs] = useState<string[]>([]);
  const [installError, setInstallError] = useState<string | null>(null);

  // Helper to re-check requirements
  const refreshRequirements = async () => {
    setCheckingReqs(true);
    try {
      const res = await fetch("/api/installer/requirements");
      const data = await res.json();
      setRequirements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingReqs(false);
    }
  };

  // Helper to test manual database connection
  const handleTestDatabase = async () => {
    setDbTesting(true);
    setDbTestResult(null);
    try {
      const res = await fetch("/api/installer/test-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrf_token,
        },
        body: JSON.stringify({
          host: dbHost,
          port: parseInt(dbPort, 10) || 3306,
          database: dbName,
          username: dbUsername,
          password: dbPassword,
        }),
      });
      const data = await res.json();
      setDbTestResult(data);
    } catch (err: any) {
      setDbTestResult({
        connected: false,
        message: "Network error contacting server.",
      });
    } finally {
      setDbTesting(false);
    }
  };

  // Helper to automatically create database via Hostinger / cPanel API
  const handleAutoProvisionDatabase = async () => {
    setDbTesting(true);
    setDbTestResult(null);
    try {
      const payload: any = {
        provider,
        credentials:
          provider === "hostinger"
            ? { api_token: hostingerToken, website_id: hostingerWebsiteId }
            : {
                cpanel_host: cpanelHost,
                cpanel_port: parseInt(cpanelPort, 10) || 2083,
                cpanel_user: cpanelUser,
                api_token: cpanelToken,
              },
        database: dbName,
        username: dbUsername,
        password: dbPassword || "DbSecure" + Math.random().toString(36).substring(2, 10) + "!",
      };

      const res = await fetch("/api/installer/create-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-TOKEN": csrf_token,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setDbName(data.database);
        setDbUsername(data.username);
        setDbPassword(data.password);
        setDbHost(data.host || "127.0.0.1");
        setDbPort((data.port || 3306).toString());

        setDbTestResult({
          connected: true,
          message: data.message || "Database provisioned and configured successfully!",
        });
      } else {
        setDbTestResult({
          connected: false,
          message: data.message || "Failed to provision database.",
        });
      }
    } catch (err: any) {
      setDbTestResult({
        connected: false,
        message: "Request failed: " + err.message,
      });
    } finally {
      setDbTesting(false);
    }
  };

  // Run automated installation sequence
  const startInstallation = async () => {
    setCurrentStep(6);
    setInstalling(true);
    setInstallProgress(5);
    setInstallLogs([]);
    setInstallError(null);

    const steps = [
      {
        action: "validate_requirements",
        label: "Verifying server environment & write permissions...",
        progress: 15,
        payload: {},
      },
      {
        action: "configure_environment",
        label: "Configuring .env and database connection...",
        progress: 35,
        payload: {
          database: {
            host: dbHost,
            port: parseInt(dbPort, 10) || 3306,
            database: dbName,
            username: dbUsername,
            password: dbPassword,
          },
          site: {
            site_name: siteName,
            site_url: siteUrl,
          },
        },
      },
      {
        action: "run_migrations",
        label: "Executing database migrations safely...",
        progress: 55,
        payload: {},
      },
      {
        action: "seed_content",
        label: "Initializing portfolio content & default settings...",
        progress: 70,
        payload: {},
      },
      {
        action: "create_admin",
        label: "Creating administrator account...",
        progress: 85,
        payload: {
          admin: {
            name: adminName,
            email: adminEmail,
            password: adminPassword,
          },
        },
      },
      {
        action: "optimize_system",
        label: "Optimizing application storage & cache...",
        progress: 92,
        payload: {},
      },
      {
        action: "verify_installation",
        label: "Verifying health of database & routes...",
        progress: 97,
        payload: {},
      },
      {
        action: "finalize_lock",
        label: "Permanently locking installer for security...",
        progress: 100,
        payload: {
          site: { site_name: siteName, site_url: siteUrl },
          admin: { email: adminEmail },
        },
      },
    ];

    for (const step of steps) {
      setActiveInstallSubstep(step.label);
      try {
        const res = await fetch("/api/installer/step", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-TOKEN": csrf_token,
          },
          body: JSON.stringify({
            step: step.action,
            payload: step.payload,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || `Step '${step.action}' failed.`);
        }

        setInstallLogs((prev) => [...prev, `✓ ${data.message}`]);
        setInstallProgress(step.progress);
      } catch (err: any) {
        setInstallError(err.message || "An unexpected installation error occurred.");
        setInstalling(false);
        return;
      }
    }

    setInstalling(false);
    setTimeout(() => {
      setCurrentStep(7);
    }, 800);
  };

  // Password strength helper
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, text: "Too short", color: "bg-neutral-700" };
    if (pwd.length < 14) return { score: 1, text: "Minimum 14 characters required", color: "bg-rose-500" };
    const hasNum = /\d/.test(pwd);
    const hasSpecial = /[^a-zA-Z0-9]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    if (pwd.length >= 16 && hasNum && hasSpecial && hasUpper) {
      return { score: 3, text: "Strong password", color: "bg-emerald-500" };
    }
    return { score: 2, text: "Acceptable", color: "bg-amber-500" };
  };

  const pwdStrength = getPasswordStrength(adminPassword);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-[#f7f5ef] font-sans flex flex-col justify-between selection:bg-[#dc143c] selection:text-white">
      <Head title="Installation Wizard | Tanvir Portfolio CMS" />

      {/* Top Header */}
      <header className="border-b border-neutral-800 bg-[#0d0d0d]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="w-8 h-8 rounded bg-[#dc143c] text-white flex items-center justify-center font-bold tracking-tighter text-sm shadow-lg shadow-red-900/30">
              T.
            </span>
            <div>
              <span className="font-bold tracking-tight text-white text-base">TANVIR.</span>
              <span className="text-xs text-neutral-400 block -mt-1">Automated Web Installer</span>
            </div>
          </div>

          {/* Step Pill */}
          <div className="flex items-center space-x-2 text-xs bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-full text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-[#dc143c] animate-pulse"></span>
            <span>Step {currentStep} of 7</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-8 md:py-12 flex flex-col justify-center">
        <div className="bg-[#121212] border border-neutral-800 rounded-2xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
          {/* Subtle Ambient Background */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#dc143c]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

          {/* ========================================================================= */}
          {/* STEP 1: WELCOME */}
          {/* ========================================================================= */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#dc143c]/10 text-[#dc143c] text-xs font-medium border border-[#dc143c]/20">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Zero-Knowledge Setup</span>
              </div>

              <h1 className="text-3xl md:text-4xl font-serif tracking-tight text-white">
                Welcome to Tanvir Portfolio CMS
              </h1>

              <p className="text-neutral-400 text-sm md:text-base leading-relaxed max-w-2xl">
                This installer will automatically configure your website, generate secure application
                keys, connect your database, and bootstrap your administrative workspace. No terminal,
                SSH, Composer, or technical commands are required.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
                  <Server className="w-5 h-5 text-[#dc143c] mb-2" />
                  <h4 className="text-sm font-semibold text-white">1. Server Audit</h4>
                  <p className="text-xs text-neutral-400 mt-1">Automatic verification of PHP & extensions.</p>
                </div>
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
                  <Database className="w-5 h-5 text-[#dc143c] mb-2" />
                  <h4 className="text-sm font-semibold text-white">2. Database Setup</h4>
                  <p className="text-xs text-neutral-400 mt-1">Automated or manual database provisioning.</p>
                </div>
                <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
                  <ShieldCheck className="w-5 h-5 text-[#dc143c] mb-2" />
                  <h4 className="text-sm font-semibold text-white">3. Auto Launch</h4>
                  <p className="text-xs text-neutral-400 mt-1">Full database seeding and instant admin creation.</p>
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-800/80 flex justify-end">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-6 py-3 rounded-xl bg-[#dc143c] hover:bg-red-700 text-white font-medium text-sm flex items-center space-x-2 transition-all shadow-lg shadow-red-900/20 active:scale-[0.98]"
                >
                  <span>Start Installation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 2: SERVER REQUIREMENTS */}
          {/* ========================================================================= */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-serif text-white">Server Requirements</h2>
                  <p className="text-neutral-400 text-xs md:text-sm mt-1">
                    Verifying that your hosting server meets the PHP and filesystem standards.
                  </p>
                </div>
                <button
                  onClick={refreshRequirements}
                  disabled={checkingReqs}
                  className="px-3 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-xs text-neutral-300 hover:text-white flex items-center space-x-1.5 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${checkingReqs ? "animate-spin" : ""}`} />
                  <span>Re-check</span>
                </button>
              </div>

              {/* PHP Version Check */}
              <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Cpu className="w-5 h-5 text-neutral-400" />
                  <div>
                    <h4 className="text-sm font-medium text-white">PHP Version</h4>
                    <p className="text-xs text-neutral-400">Current: {requirements.php.current} (Required: &ge; {requirements.php.minimum})</p>
                  </div>
                </div>
                {requirements.php.passed ? (
                  <span className="flex items-center space-x-1 text-emerald-400 text-xs font-semibold bg-emerald-950/60 border border-emerald-800/50 px-2.5 py-1 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Passed</span>
                  </span>
                ) : (
                  <span className="flex items-center space-x-1 text-rose-400 text-xs font-semibold bg-rose-950/60 border border-rose-800/50 px-2.5 py-1 rounded-full">
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Upgrade Required</span>
                  </span>
                )}
              </div>

              {/* Extensions Grid */}
              <div>
                <h4 className="text-xs uppercase tracking-wider font-semibold text-neutral-400 mb-3">
                  PHP Extensions Check
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(requirements.extensions.required).map(([key, ext]) => (
                    <div
                      key={key}
                      className="p-2.5 rounded-lg border border-neutral-800/80 bg-neutral-900/30 flex items-center justify-between text-xs"
                    >
                      <span className="text-neutral-300">{ext.name}</span>
                      {ext.loaded ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Directory Permissions */}
              <div>
                <h4 className="text-xs uppercase tracking-wider font-semibold text-neutral-400 mb-3">
                  Directory Permissions
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {Object.entries(requirements.permissions.paths).map(([rel, item]) => (
                    <div
                      key={rel}
                      className="p-2.5 rounded-lg border border-neutral-800/80 bg-neutral-900/30 flex items-center justify-between text-xs"
                    >
                      <span className="font-mono text-neutral-300">{rel}</span>
                      {item.writable ? (
                        <span className="text-emerald-400 font-medium">Writable</span>
                      ) : (
                        <span className="text-rose-400 font-medium">Read Only</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Actions */}
              <div className="pt-6 border-t border-neutral-800/80 flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800/60 text-neutral-300 hover:text-white text-xs font-medium flex items-center space-x-1.5 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => setCurrentStep(3)}
                  disabled={!requirements.canProceed}
                  className="px-6 py-2.5 rounded-xl bg-[#dc143c] hover:bg-red-700 text-white font-medium text-xs flex items-center space-x-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  <span>Continue to Hosting Selection</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 3: HOSTING PROVIDER SELECTION */}
          {/* ========================================================================= */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-serif text-white">Select Hosting Provider</h2>
                <p className="text-neutral-400 text-xs md:text-sm mt-1">
                  Choose your hosting control panel to enable automated database creation or manual configuration.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Hostinger */}
                <div
                  onClick={() => {
                    setProvider("hostinger");
                    setDbMode("auto");
                  }}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all relative ${
                    provider === "hostinger"
                      ? "border-[#dc143c] bg-[#dc143c]/10 shadow-lg shadow-red-950/20"
                      : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"
                  }`}
                >
                  {detectedHosting.provider === "hostinger" && (
                    <span className="absolute top-3 right-3 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400">
                      Detected
                    </span>
                  )}
                  <div className="w-10 h-10 rounded-xl bg-purple-950/60 border border-purple-800 flex items-center justify-center text-purple-400 mb-3 font-bold text-lg">
                    H
                  </div>
                  <h4 className="text-base font-semibold text-white">Hostinger hPanel</h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    Automated database provisioning via official Hostinger API.
                  </p>
                </div>

                {/* cPanel */}
                <div
                  onClick={() => {
                    setProvider("cpanel");
                    setDbMode("auto");
                  }}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all relative ${
                    provider === "cpanel"
                      ? "border-[#dc143c] bg-[#dc143c]/10 shadow-lg shadow-red-950/20"
                      : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"
                  }`}
                >
                  {detectedHosting.provider === "cpanel" && (
                    <span className="absolute top-3 right-3 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-400">
                      Detected
                    </span>
                  )}
                  <div className="w-10 h-10 rounded-xl bg-amber-950/60 border border-amber-800 flex items-center justify-center text-amber-400 mb-3 font-bold text-lg">
                    cP
                  </div>
                  <h4 className="text-base font-semibold text-white">cPanel</h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    Automated database and user setup via cPanel UAPI tokens.
                  </p>
                </div>

                {/* Generic */}
                <div
                  onClick={() => {
                    setProvider("generic");
                    setDbMode("manual");
                  }}
                  className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                    provider === "generic"
                      ? "border-[#dc143c] bg-[#dc143c]/10 shadow-lg shadow-red-950/20"
                      : "border-neutral-800 bg-neutral-900/40 hover:border-neutral-700"
                  }`}
                >
                  <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300 mb-3">
                    <Server className="w-5 h-5" />
                  </div>
                  <h4 className="text-base font-semibold text-white">Other / Generic</h4>
                  <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                    Direct manual database credentials for any standard shared hosting.
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-neutral-900/40 border border-neutral-800 text-xs text-neutral-400 flex items-start space-x-2.5">
                <HelpCircle className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                <span>
                  {provider === "hostinger"
                    ? "Hostinger hPanel selected. You can supply your Hostinger API token to create the database automatically, or switch to manual credentials anytime."
                    : provider === "cpanel"
                    ? "cPanel selected. You can supply your cPanel username & API token to automatically provision the database and user."
                    : "Generic hosting selected. You will simply enter your database host, name, username, and password created in your hosting panel."}
                </span>
              </div>

              <div className="pt-6 border-t border-neutral-800/80 flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800/60 text-neutral-300 hover:text-white text-xs font-medium flex items-center space-x-1.5 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-6 py-2.5 rounded-xl bg-[#dc143c] hover:bg-red-700 text-white font-medium text-xs flex items-center space-x-2 transition-all active:scale-[0.98]"
                >
                  <span>Continue to Database Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 4: DATABASE CONFIGURATION */}
          {/* ========================================================================= */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl md:text-3xl font-serif text-white">Database Configuration</h2>
                  <p className="text-neutral-400 text-xs md:text-sm mt-1">
                    Connect your MySQL / MariaDB database for storing CMS content and settings.
                  </p>
                </div>

                {provider !== "generic" && (
                  <button
                    onClick={() => setDbMode(dbMode === "auto" ? "manual" : "auto")}
                    className="text-xs text-[#dc143c] hover:underline font-medium"
                  >
                    {dbMode === "auto" ? "Switch to Manual Credentials" : "Use API Auto-Provisioning"}
                  </button>
                )}
              </div>

              {/* Automated Provisioning Form */}
              {dbMode === "auto" && provider === "hostinger" && (
                <div className="space-y-4 p-5 rounded-2xl border border-purple-900/40 bg-purple-950/10">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-purple-300">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Hostinger Automated Database Provisioning</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Hostinger API Token
                    </label>
                    <input
                      type="password"
                      value={hostingerToken}
                      onChange={(e) => setHostingerToken(e.target.value)}
                      placeholder="Paste your Hostinger API token"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#dc143c]"
                    />
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Available in Hostinger hPanel &rarr; Account Settings &rarr; API Tokens.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Database Name
                      </label>
                      <input
                        type="text"
                        value={dbName}
                        onChange={(e) => setDbName(e.target.value)}
                        placeholder="portfolio_db"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#dc143c]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Database Username
                      </label>
                      <input
                        type="text"
                        value={dbUsername}
                        onChange={(e) => setDbUsername(e.target.value)}
                        placeholder="portfolio_usr"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#dc143c]"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAutoProvisionDatabase}
                    disabled={dbTesting || !hostingerToken}
                    className="w-full py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-medium text-xs flex items-center justify-center space-x-2 transition-all disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${dbTesting ? "animate-spin" : ""}`} />
                    <span>{dbTesting ? "Provisioning via Hostinger API..." : "Create Database via Hostinger API"}</span>
                  </button>
                </div>
              )}

              {/* cPanel Auto Provisioning */}
              {dbMode === "auto" && provider === "cpanel" && (
                <div className="space-y-4 p-5 rounded-2xl border border-amber-900/40 bg-amber-950/10">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-amber-300">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>cPanel UAPI Automated Database Provisioning</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        cPanel Username
                      </label>
                      <input
                        type="text"
                        value={cpanelUser}
                        onChange={(e) => setCpanelUser(e.target.value)}
                        placeholder="your_cpanel_user"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#dc143c]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        cPanel API Token
                      </label>
                      <input
                        type="password"
                        value={cpanelToken}
                        onChange={(e) => setCpanelToken(e.target.value)}
                        placeholder="Paste your cPanel API token"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#dc143c]"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAutoProvisionDatabase}
                    disabled={dbTesting || !cpanelUser || !cpanelToken}
                    className="w-full py-2.5 rounded-xl bg-amber-700 hover:bg-amber-800 text-white font-medium text-xs flex items-center justify-center space-x-2 transition-all disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${dbTesting ? "animate-spin" : ""}`} />
                    <span>{dbTesting ? "Provisioning via cPanel UAPI..." : "Provision Database via cPanel"}</span>
                  </button>
                </div>
              )}

              {/* Manual Database Credentials (Universal Fallback) */}
              {(dbMode === "manual" || provider === "generic") && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Database Host
                      </label>
                      <input
                        type="text"
                        value={dbHost}
                        onChange={(e) => setDbHost(e.target.value)}
                        placeholder="127.0.0.1 or localhost"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#dc143c]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Port
                      </label>
                      <input
                        type="text"
                        value={dbPort}
                        onChange={(e) => setDbPort(e.target.value)}
                        placeholder="3306"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#dc143c]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Database Name
                      </label>
                      <input
                        type="text"
                        value={dbName}
                        onChange={(e) => setDbName(e.target.value)}
                        placeholder="e.g. u12345_portfolio"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#dc143c]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                        Database Username
                      </label>
                      <input
                        type="text"
                        value={dbUsername}
                        onChange={(e) => setDbUsername(e.target.value)}
                        placeholder="e.g. u12345_admin"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#dc143c]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Database Password
                    </label>
                    <div className="relative">
                      <input
                        type={showDbPassword ? "text" : "password"}
                        value={dbPassword}
                        onChange={(e) => setDbPassword(e.target.value)}
                        placeholder="Enter MySQL user password"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-white focus:outline-none focus:border-[#dc143c]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDbPassword(!showDbPassword)}
                        className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-200"
                      >
                        {showDbPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={handleTestDatabase}
                      disabled={dbTesting || !dbName || !dbUsername}
                      className="px-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-neutral-200 hover:text-white text-xs font-medium flex items-center space-x-1.5 transition-colors disabled:opacity-40"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${dbTesting ? "animate-spin" : ""}`} />
                      <span>{dbTesting ? "Testing..." : "Test Database Connection"}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Test Result Feedback */}
              {dbTestResult && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-start space-x-2.5 ${
                    dbTestResult.connected
                      ? "bg-emerald-950/40 border-emerald-800 text-emerald-300"
                      : "bg-rose-950/40 border-rose-800 text-rose-300"
                  }`}
                >
                  {dbTestResult.connected ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-semibold">{dbTestResult.message}</span>
                    {dbTestResult.details?.hasExistingTables && (
                      <p className="mt-1 text-[11px] text-amber-300">
                        Existing database tables detected. Existing data will be preserved safely.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="pt-6 border-t border-neutral-800/80 flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(3)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800/60 text-neutral-300 hover:text-white text-xs font-medium flex items-center space-x-1.5 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  onClick={() => setCurrentStep(5)}
                  disabled={!dbTestResult?.connected}
                  className="px-6 py-2.5 rounded-xl bg-[#dc143c] hover:bg-red-700 text-white font-medium text-xs flex items-center space-x-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  <span>Continue to Website Details</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 5: WEBSITE & ADMIN INFORMATION */}
          {/* ========================================================================= */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-serif text-white">Website & Administrator</h2>
                <p className="text-neutral-400 text-xs md:text-sm mt-1">
                  Configure your primary website branding and create your secure administrator account.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Website Name
                  </label>
                  <input
                    type="text"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    placeholder="My Portfolio"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#dc143c]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                    Website URL
                  </label>
                  <input
                    type="text"
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#dc143c]"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-800">
                <h4 className="text-xs uppercase tracking-wider font-semibold text-neutral-400 mb-3">
                  Initial Administrator Account
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Admin Full Name
                    </label>
                    <input
                      type="text"
                      value={adminName}
                      onChange={(e) => setAdminName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#dc143c]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Admin Email (Sign-in Identifier)
                    </label>
                    <input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="owner@yourdomain.com"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#dc143c]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Admin Password (Minimum 14 Characters)
                    </label>
                    <div className="relative">
                      <input
                        type={showAdminPassword ? "text" : "password"}
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••••••••"
                        className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-white focus:outline-none focus:border-[#dc143c]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute right-3 top-2.5 text-neutral-400 hover:text-neutral-200"
                      >
                        {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {adminPassword && (
                      <div className="mt-1.5 flex items-center space-x-2">
                        <div className="h-1 flex-1 bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${pwdStrength.color}`}
                            style={{ width: `${(pwdStrength.score / 3) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-[10px] text-neutral-400">{pwdStrength.text}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-300 mb-1.5">
                      Confirm Password
                    </label>
                    <input
                      type={showAdminPassword ? "text" : "password"}
                      value={adminPasswordConfirm}
                      onChange={(e) => setAdminPasswordConfirm(e.target.value)}
                      placeholder="••••••••••••••"
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#dc143c]"
                    />
                    {adminPassword && adminPasswordConfirm && adminPassword !== adminPasswordConfirm && (
                      <p className="text-[11px] text-rose-400 mt-1">Passwords do not match.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-neutral-800/80 flex items-center justify-between">
                <button
                  onClick={() => setCurrentStep(4)}
                  className="px-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800/60 text-neutral-300 hover:text-white text-xs font-medium flex items-center space-x-1.5 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>
                <button
                  onClick={startInstallation}
                  disabled={
                    !adminEmail ||
                    adminPassword.length < 14 ||
                    adminPassword !== adminPasswordConfirm ||
                    !siteName
                  }
                  className="px-6 py-2.5 rounded-xl bg-[#dc143c] hover:bg-red-700 text-white font-medium text-xs flex items-center space-x-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Install Application Now</span>
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 6: AUTOMATIC INSTALLATION EXECUTION */}
          {/* ========================================================================= */}
          {currentStep === 6 && (
            <div className="space-y-6 py-4">
              <div className="text-center space-y-2">
                <h2 className="text-2xl md:text-3xl font-serif text-white">Installing Application...</h2>
                <p className="text-neutral-400 text-xs md:text-sm">
                  Please keep this browser window open while we configure your production environment.
                </p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-neutral-400">
                  <span className="font-medium text-neutral-300">{activeInstallSubstep}</span>
                  <span>{installProgress}%</span>
                </div>
                <div className="h-2 w-full bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#dc143c] transition-all duration-500 ease-out"
                    style={{ width: `${installProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Error Box */}
              {installError && (
                <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs space-y-2">
                  <div className="flex items-center space-x-2 font-semibold">
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>Installation Encountered an Issue:</span>
                  </div>
                  <p>{installError}</p>
                  <div className="pt-2 flex items-center space-x-3">
                    <button
                      onClick={startInstallation}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-800 hover:bg-rose-700 text-white font-medium text-xs flex items-center space-x-1.5"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                    <button
                      onClick={() => setCurrentStep(4)}
                      className="px-3.5 py-1.5 rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-300 hover:text-white text-xs"
                    >
                      Edit Database Credentials
                    </button>
                  </div>
                </div>
              )}

              {/* Live Activity Log */}
              <div className="bg-neutral-950 border border-neutral-800/80 rounded-xl p-4 font-mono text-[11px] text-neutral-400 max-h-48 overflow-y-auto space-y-1">
                {installLogs.map((log, idx) => (
                  <div key={idx} className="flex items-center space-x-1.5 text-emerald-400">
                    <span>{log}</span>
                  </div>
                ))}
                {installing && (
                  <div className="flex items-center space-x-2 text-neutral-500 italic">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Executing step...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* STEP 7: INSTALLATION COMPLETE */}
          {/* ========================================================================= */}
          {currentStep === 7 && (
            <div className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-700 flex items-center justify-center text-emerald-400 mx-auto shadow-xl shadow-emerald-950/40">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-3xl font-serif text-white">Installation Successful!</h2>
                <p className="text-neutral-400 text-sm max-w-lg mx-auto">
                  Your portfolio website and administrative CRM dashboard are live and fully operational.
                </p>
              </div>

              {/* Details Summary Card */}
              <div className="max-w-md mx-auto p-4 rounded-xl border border-neutral-800 bg-neutral-900/40 text-left space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-400">Website URL:</span>
                  <a href={siteUrl} target="_blank" rel="noreferrer" className="text-white hover:underline flex items-center space-x-1">
                    <span>{siteUrl}</span>
                    <ExternalLink className="w-3 h-3 text-neutral-500" />
                  </a>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-400">Admin Login:</span>
                  <a href={`${siteUrl}/admin`} target="_blank" rel="noreferrer" className="text-[#dc143c] font-medium hover:underline flex items-center space-x-1">
                    <span>{siteUrl}/admin</span>
                    <ExternalLink className="w-3 h-3 text-[#dc143c]" />
                  </a>
                </div>
                <div className="flex justify-between py-1 border-b border-neutral-800/60">
                  <span className="text-neutral-400">Admin Email:</span>
                  <span className="text-white font-mono">{adminEmail}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-neutral-400">Security Status:</span>
                  <span className="text-emerald-400 font-medium">Permanently Locked</span>
                </div>
              </div>

              <div className="max-w-md mx-auto p-3 rounded-lg bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400 flex items-start space-x-2 text-left">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  The web installer has created an immutable lockfile (<code className="text-neutral-300">storage/installed.lock</code>) and disabled future access to setup routes for your security.
                </span>
              </div>

              {/* Launch Actions */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="/admin"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#dc143c] hover:bg-red-700 text-white font-medium text-xs flex items-center justify-center space-x-2 transition-all shadow-lg shadow-red-900/20 active:scale-[0.98]"
                >
                  <Lock className="w-4 h-4" />
                  <span>Open Admin Workspace</span>
                </a>
                <a
                  href="/"
                  className="w-full sm:w-auto px-6 py-3 rounded-xl border border-neutral-700 bg-neutral-800/80 hover:bg-neutral-800 text-neutral-200 font-medium text-xs flex items-center justify-center space-x-2 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  <span>Visit Public Website</span>
                </a>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800/60 py-4 text-center text-xs text-neutral-500">
        <p>&copy; {new Date().getFullYear()} Md Tanvir Hossain. All rights reserved.</p>
      </footer>
    </div>
  );
}
