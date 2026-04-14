import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MailCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import studentBg from "@/assets/student.png";

export default function ConfirmEmailPage() {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img src={studentBg} alt="Students" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-primary/20" />
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md text-center">
          <div className="bg-card rounded-2xl shadow-card border border-border p-10">
            <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-6">
              <MailCheck className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-card-foreground mb-3">Check Your Email</h2>
            <p className="text-muted-foreground mb-2">
              We've sent a confirmation link to your email address.
            </p>
            <p className="text-muted-foreground mb-6 text-sm">
              Please click the link in the email to verify your account. Once confirmed, you can sign in.
            </p>
            <div className="p-4 rounded-xl bg-muted/50 border border-border mb-6">
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">Didn't receive an email?</span><br />
                Check your spam folder or try registering again.
              </p>
            </div>
            <Link to="/login">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Login
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
