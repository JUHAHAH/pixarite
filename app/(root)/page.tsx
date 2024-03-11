import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/nextjs';

export default function Home() {
  return (
    <div>
      <SignInButton />
      <UserButton />
    </div>
  );
}
