import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      position="top-center"
      toastOptions={{
        style: {
          background: "hsl(0 0% 10%)",
          border: "1px solid hsl(0 0% 18%)",
          color: "hsl(0 0% 96%)",
          fontFamily: "Space Grotesk, system-ui, sans-serif",
          fontWeight: "500",
        },
        classNames: {
          success: "!border-green-500/30",
          error: "!border-red-500/30",
          warning: "!border-orange-500/30",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
