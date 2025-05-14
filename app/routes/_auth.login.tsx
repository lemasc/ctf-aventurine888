import { AuthForm } from "~/components/auth/auth-form";
import { rpc } from "~/lib/rpc";

export default function LoginPage() {
  const handleLogin = async (data: {
    username: string;
    password: string;
    pin?: string;
  }) => {
    const response = await rpc.api.login.$post({
      json: data,
    });
    if (response.status !== 200) {
      if (response.status === 402) {
        // If PIN is required, we'll handle it in the form component
        throw new Error("PIN required");
      } else {
        const { message } = await response.json();
        throw new Error(message);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-20"></div>
        <div className="relative">
          <AuthForm mode="login" onSubmit={handleLogin} />
        </div>
      </div>
    </div>
  );
}
