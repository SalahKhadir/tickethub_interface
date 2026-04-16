export const metadata = {
  title: "Auth | TicketHub",
};

export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bright-snow px-6 py-12">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
