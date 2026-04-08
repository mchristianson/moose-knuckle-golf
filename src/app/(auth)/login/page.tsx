import Image from "next/image";
import { PhoneLoginForm } from "@/components/auth/phone-login-form";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";

export default function LoginPage() {
  return (
    <div className="bg-zinc-900/90 backdrop-blur-xl border border-zinc-800/60 p-8 rounded-2xl shadow-2xl">
      <div className="flex justify-center mb-6">
        <Image src="/logo.png" alt="Moose Knuckle Golf League" width={120} height={120} />
      </div>

      <GoogleSignInButton />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-700"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-zinc-900 text-zinc-500">Or continue with phone</span>
        </div>
      </div>

      <PhoneLoginForm />
    </div>
  );
}
