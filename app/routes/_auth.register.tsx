import { AuthForm, type OnRegisterHandler } from "~/components/auth/auth-form";

export default function RegisterPage() {
  const handleRegister: OnRegisterHandler = async ({
    username,
    password,
    pin,
  }) => {
    if (!pin || pin.length !== 6) {
      throw new Error("PIN must be 6 digits");
    }

    const response = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username,
        password,
        pin,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Registration failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg blur opacity-20"></div>
        <div className="relative">
          <AuthForm mode="register" onSubmit={handleRegister} />
        </div>
      </div>
    </div>
  );
}
