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
import createSupabaseClientClient from "@/lib/supabase/client";
import { useTransition } from "react";

const FormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, {
    message: "Password is required.",
  }),
});

export default function SignInForm() {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    startTransition(async () => {
      const supabase = createSupabaseClientClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error?.message) {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: (
            <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
              <code className="text-white">{error.message}</code>
            </pre>
          ),
        });
      } else {
        window.location.href = "/";
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
        <Button
          type="submit"
          disabled={isPending}
          className="w-full h-10 rounded-md bg-[#e8772e] hover:bg-[#d66920] text-white text-xs font-bold font-orbitron tracking-[0.1em] shadow-[2px_2px_8px_rgba(232,119,46,0.3)] hover:shadow-[2px_2px_12px_rgba(232,119,46,0.4)] transition-all duration-200"
        >
          {isPending ? (
            <Icons.spinner className="h-4 w-4 animate-spin" />
          ) : (
            "SIGN IN"
          )}
        </Button>
      </form>
    </Form>
  );
}
