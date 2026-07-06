import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import { toast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Icons } from "@/components/icons";
import { signUpWithEmailAndPassword } from "@/actions";
import { useTransition } from "react";

const FormSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(6, {
      message: "Password is required.",
    }),
    confirm: z.string().min(6, {
      message: "Password is required.",
    }),
  })
  .refine((data) => data.confirm === data.password, {
    message: "Password did not match",
    path: ["confirm"],
  });

export default function RegisterForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
      confirm: "",
    },
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    startTransition(async () => {
      const result = await signUpWithEmailAndPassword(data);
      const { error } = result;

      if (error?.message) {
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: (
            <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
              <code className="text-white">{error.message}</code>
            </pre>
          ),
        });
      } else {
        window.location.href = "/auth";
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-5">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-bold text-gray-500 font-orbitron tracking-[0.15em]">EMAIL</FormLabel>
              <FormControl>
                <Input
                  placeholder="example@gmail.com"
                  {...field}
                  type="email"
                  onChange={field.onChange}
                  className="bg-gray-50 border-gray-200/60 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:ring-primary/30 rounded-md h-10"
                />
              </FormControl>
              <FormMessage className="text-[10px] text-red-500 font-semibold" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-bold text-gray-500 font-orbitron tracking-[0.15em]">PASSWORD</FormLabel>
              <FormControl>
                <Input
                  placeholder="password"
                  {...field}
                  type="password"
                  onChange={field.onChange}
                  className="bg-gray-50 border-gray-200/60 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:ring-primary/30 rounded-md h-10"
                />
              </FormControl>
              <FormMessage className="text-[10px] text-red-500 font-semibold" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="confirm"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-[10px] font-bold text-gray-500 font-orbitron tracking-[0.15em]">CONFIRM PASSWORD</FormLabel>
              <FormControl>
                <Input
                  placeholder="Confirm Password"
                  {...field}
                  type="password"
                  onChange={field.onChange}
                  className="bg-gray-50 border-gray-200/60 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:ring-primary/30 rounded-md h-10"
                />
              </FormControl>
              <FormMessage className="text-[10px] text-red-500 font-semibold" />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-10 rounded-md bg-[#e8772e] hover:bg-[#d66920] text-white text-xs font-bold font-orbitron tracking-[0.1em] shadow-[2px_2px_8px_rgba(232,119,46,0.3)] hover:shadow-[2px_2px_12px_rgba(232,119,46,0.4)] transition-all duration-200"
        >
          {isPending ? (
            <Icons.spinner className="h-4 w-4 animate-spin" />
          ) : (
            "REGISTER"
          )}
        </Button>
      </form>
    </Form>
  );
}
