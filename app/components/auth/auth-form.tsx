import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { InputOTPGroup } from "../ui/input-otp";
import { InputOTP, InputOTPSlot } from "../ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { useNavigate } from "react-router";

interface AuthFormProps {
  mode: "login" | "register";
  onSubmit: (data: {
    username: string;
    password: string;
    pin?: string;
  }) => Promise<void>;
}

export function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPinRequired, setIsPinRequired] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await onSubmit({ username, password, pin });
      navigate("/app", {
        replace: true,
      });
    } catch (err) {
      if (err instanceof Error && err.message === "PIN required") {
        setIsPinRequired(true);
        setError("Please create a new PIN for your account");
      } else {
        setError(err instanceof Error ? err.message : "An error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-[380px] scale-110">
      <CardHeader>
        <CardTitle>{mode === "login" ? "Login" : "Register"}</CardTitle>
        <CardDescription>
          {mode === "login"
            ? "Enter your credentials to access your account"
            : "Create a new account to get started"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="Enter your username"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>
          {(mode === "register" || isPinRequired) && (
            <div className="space-y-2">
              <Label htmlFor="pin">Transfer PIN (6 digits)</Label>
              <p className="text-xs text-zinc-600">
                Use when confirming credit transfer.
              </p>
              <InputOTP
                value={pin}
                onChange={(value) => setPin(value)}
                maxLength={6}
                required
                pattern={REGEXP_ONLY_DIGITS}
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          )}
          {error && (
            <div className="text-sm font-medium text-red-700">{error}</div>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Loading..." : mode === "login" ? "Login" : "Register"}
          </Button>
        </form>
        <div className="text-center text-sm">
          {mode === "login" ? (
            <span>
              Don't have an account?{" "}
              <Button
                variant="link"
                onClick={() => navigate("/register")}
                className="p-0 text-yellow-600 cursor-pointer"
              >
                Register
              </Button>
            </span>
          ) : (
            <span>
              Already have an account?{" "}
              <Button
                variant="link"
                onClick={() => navigate("/login")}
                className="p-0 text-yellow-600 cursor-pointer"
              >
                Login
              </Button>
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
