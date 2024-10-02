"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import toast from "react-hot-toast";
import { auth } from "@/lib/axios";
import { useNavigate } from "react-router-dom";

const email = z.string().email();
const phone = z
  .string()
  .min(10)
  .max(15)
  .refine((value) => {
    return /^\d+$/.test(value);
  });

const formSchema = z
  .object({
    emailOrPhone: z.string().min(2).max(50),
    email: email.nullable(),
    phone: phone.nullable(),
    password: z.string().min(6),
  })
  .refine(
    (data) => {
      if ((data.email && !data.phone) || (!data.email && data.phone)) {
        return true;
      }
      return false;
    },
    {
      message: "Either email or phone is required",
      path: ["emailOrPhone"], // This can be used to show the error on both fields
    }
  );

interface LoginFormProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function LoginForm({ className, ...props }: LoginFormProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      emailOrPhone: "",
      email: null,
      phone: null,
      password: "",
    },
  });
  const {
    // register,
    // handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = form;

  const navigate = useNavigate();

  const emailOrPhone = watch("emailOrPhone");

  React.useEffect(() => {
    if (emailOrPhone.includes("@")) {
      const parsed = email.safeParse(emailOrPhone);
      if (parsed.success && parsed.data !== undefined) {
        setValue("email", emailOrPhone);
        setValue("phone", null);
      }
    } else if (emailOrPhone.match(/^\d+$/)) {
      const parsed = phone.safeParse(emailOrPhone);
      if (parsed.success && parsed.data !== undefined) {
        setValue("phone", emailOrPhone);
        setValue("email", null);
      }
    } else {
      form.setError("emailOrPhone", {
        type: "invalid",
        message: "Invalid email or phone",
      });
      setValue("email", null);
      setValue("phone", null);
    }
  }, [emailOrPhone, setValue]);

  async function onSubmit(data: z.infer<typeof formSchema>) {
    try {
      const reqObj: {
        email?: string | null;
        phone?: string | null;
        password: string;
      } = { password: data.password };
      if (data.email) {
        reqObj.email = data.email;
      }
      if (data.phone) {
        reqObj.phone = data.phone;
      }
      const res = await auth.post("/login", reqObj);
      if (res.status) {
        toast.success("Logged in successfully");
        navigate("/dashboard");
      }
      console.log(res.data);
    } catch (error: any) {
      toast.error("Failed to login");
      toast.error(error.message);
    }
  }

  return (
    <div className={cn("grid gap-6", className)} {...props}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
          <FormField
            control={form.control}
            name="emailOrPhone"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Email or Phone"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="********"
                    {...field}
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button disabled={isSubmitting} className="w-full">
            {isSubmitting && (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            )}
            Login with Email/Phone
          </Button>
        </form>
      </Form>
    </div>
  );
}
