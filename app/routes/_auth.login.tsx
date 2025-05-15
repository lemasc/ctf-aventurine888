import { AuthForm, type OnLoginHandler } from "~/components/auth/auth-form";

export default function LoginPage() {
  const handleLogin: OnLoginHandler = async (data) => {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
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
