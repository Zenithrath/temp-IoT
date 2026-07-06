"use client";
import { startTransition, useTransition } from "react";
import { Icons } from "../icons";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { createSetting } from "@/actions";
import { toast } from "../ui/use-toast";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../ui/form";
import { cn } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

const FormSchema = z.object({
  thingsboard_device_id: z.string({
    required_error: "Device ID is required",
    invalid_type_error: "Device ID must be a string",
  }),
  thingsboard_access_token: z.string({
    required_error: "Access token is required",
    invalid_type_error: "Access token must be a string",
  }),
});

export const SettingForm = () => {
  const [isPending, startTransition] = useTransition();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      thingsboard_device_id: "",
      thingsboard_access_token: "",
    },
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    startTransition(async () => {
      const result = await createSetting(data);
      const { error } = result;

      if (error?.message) {
        console.log(error.message);
        toast({
          variant: "destructive",
          title: "You submitted the following values:",
          description: (
            <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
              <code className="text-white">{error.message}</code>
            </pre>
          ),
        });
      } else {
        console.log("succes");
        toast({
          title: "You submitted the following values:",
          description: (
            <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
              <code className="text-white">Successfully Send</code>
            </pre>
          ),
        });
      }
    });
  }
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6 px-3 md:px-0">
        <FormField
          control={form.control}
          name="thingsboard_device_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex justify-start">ThingsBoard Device ID*</FormLabel>
              <FormControl>
                <Input
                  className="border-blue-950"
                  placeholder="a1b2c3d4-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  {...field}
                  type="string"
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                Internal Device UUID dari ThingsBoard. Buka device → Copy Device ID.
              </FormDescription>
              <FormMessage className="flex justify-start" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="thingsboard_access_token"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex justify-start">Access Token*</FormLabel>
              <FormControl>
                <Input
                  className="border-blue-950"
                  placeholder="Copy Access Token dari device ThingsBoard"
                  {...field}
                  type="string"
                  onChange={field.onChange}
                />
              </FormControl>
              <FormDescription>
                Device access token dari ThingsBoard, dipakai ESP32 untuk autentikasi MQTT.
              </FormDescription>
              <FormMessage className="flex justify-start" />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full flex gap-2">
          Edit
          <Icons.spinner
            className={cn("animate-spin", { hidden: !isPending })}
          />
        </Button>
      </form>
    </Form>
  );
};
