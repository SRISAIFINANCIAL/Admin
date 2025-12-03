import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Users, FileText, Download, LogOut, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BACKEND_URL } from "@/config";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [applications, setApplications] = useState([]);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [filterLoan, setFilterLoan] = useState("");
  const [filterGender, setFilterGender] = useState("");
  const [filterDate, setFilterDate] = useState("");

  useEffect(() => {
    const token = sessionStorage.getItem("admin_token");
    if (!token) {
      navigate("/admin/login");
      return;
    }
    fetchApplications(token);
  }, []);

  const handleDelete = async (application) => {
    if (!confirm(`Are you sure you want to delete application ${application.name}?`)) return;

    try {
      const token = sessionStorage.getItem("admin_token");

      const res = await fetch(
        `${BACKEND_URL}/api/applications/${application._id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const text = await res.text();
      let data;

      try {
        data = JSON.parse(text);
      } catch {
        console.error("Non-JSON response:", text);
        throw new Error("Server returned HTML instead of JSON");
      }

      if (!res.ok) {
        toast({
          title: "Error",
          description: data.message || "Failed to delete application",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Deleted",
        description: `Application ${application._id} has been deleted`,
      });

      setApplications((prev) => prev.filter((app) => app._id !== application._id));
      setIsDialogOpen(false);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Server not responding",
        variant: "destructive",
      });
    }
  };

  const fetchApplications = async (token) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        sessionStorage.removeItem("admin_token");
        navigate("/admin/login");
        return;
      }

      const data = await res.json();
      setApplications(data);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to load applications",
        variant: "destructive",
      });
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_token");
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
    navigate("/admin/login");
  };

  const handleViewDetails = (application) => {
    setSelectedApplication(application);
    setIsDialogOpen(true);
  };

  const handleDownloadPDF = async (application) => {
    try {
      const token = sessionStorage.getItem("admin_token");

      const res = await fetch(
        `${BACKEND_URL}/api/applications/${application._id}/pdf`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `application_${application._id}.pdf`;
      a.click();

      toast({
        title: "PDF Downloaded",
        description: `Application ${application._id} PDF downloaded`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to download PDF",
        variant: "destructive",
      });
    }
  };

  const formatLoanCategory = (category) => {
    const categories = {
      personal: "Personal Loan",
      housing: "Housing Loan",
      business: "Business Loan",
      vehicle: "Vehicle Loan",
    };
    return categories[category] || category;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 py-8 px-4">
      <div className="container max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage loan applications
            </p>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/admin/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>

            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* TABLE SECTION (unchanged from your version) */}
        {/* ... all your existing table code stays the same ... */}

      </div>

      {/* VIEW DETAILS MODAL */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto p-6 rounded-xl">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Complete details for application {selectedApplication?._id}
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4">

              {/** Helper component */}
              {[ 
                ["Full Name", selectedApplication.name],
                ["Phone Number", selectedApplication.phoneNumber],
                ["Primary Contact Number", selectedApplication.primaryContactNumber],
                ["Gender", selectedApplication.gender],
                ["Date of Birth", selectedApplication.dateOfBirth],
                ["Loan Type", formatLoanCategory(selectedApplication.loanCategory)],
                ["Loan Amount", selectedApplication.loanAmount],
                ["Address", selectedApplication.address],
                ["Referral Name 1", selectedApplication.referralName1],
                ["Referral Phone 1", selectedApplication.referralPhone1],
                ["Referral Name 2", selectedApplication.referralName2],
                ["Referral Phone 2", selectedApplication.referralPhone2],
              ].map(([label, value]) => (
                <div key={label}>
                  <p className="text-sm font-medium text-muted-foreground">{label}</p>
                  <p className="font-medium">{value || "-"}</p>
                </div>
              ))}

              <div className="col-span-2 flex justify-end gap-3 mt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Close
                </Button>

                <Button
                  onClick={() => handleDownloadPDF(selectedApplication)}
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" /> PDF
                </Button>

                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedApplication)}
                >
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
