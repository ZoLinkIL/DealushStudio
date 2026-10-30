import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Only the email(s) in ALLOWED_EMAIL may ever sign in. Anyone else is rejected
// at Google sign-in AND on every request (defense in depth).
export function allowedEmails(): string[] {
  return (process.env.ALLOWED_EMAIL ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowed(email: string | null | undefined): boolean {
  const list = allowedEmails();
  return !!email && list.length > 0 && list.includes(email.toLowerCase());
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  trustHost: true,
  pages: { signIn: "/login", error: "/login" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 90 },
  callbacks: {
    signIn({ profile }) {
      const verified = (profile as { email_verified?: boolean } | undefined)?.email_verified;
      return verified !== false && isAllowed(profile?.email);
    },
    authorized({ auth }) {
      return isAllowed(auth?.user?.email);
    },
  },
});

/** Use at the top of every server action / private route. */
export async function requireUser() {
  const session = await auth();
  if (!isAllowed(session?.user?.email)) throw new Error("לא מורשה");
  return session!.user!;
}
