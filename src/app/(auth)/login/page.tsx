import Image from "next/image";
import { PhoneLoginForm } from "@/components/auth/phone-login-form";
import { GoogleSignInButton } from "@/components/auth/google-signin-button";

export default function LoginPage() {
  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <div className="flex justify-center mb-6">
        <Image src="/logo.png" alt="Moose Knuckle Golf League" width={120} height={120} />
      </div>

      <GoogleSignInButton />

      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with phone</span>
        </div>
      </div>

      <PhoneLoginForm />
    </div>
  );
}
