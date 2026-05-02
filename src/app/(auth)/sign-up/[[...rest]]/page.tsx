import { SignUp } from '@clerk/nextjs'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background bg-grid">
      <div className="space-y-6 text-center">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-tight">
            Grin<span className="text-lime-400">Dev</span>
          </h1>
          <p className="text-sm text-zinc-500 font-mono mt-1">Join. Solve. Repeat.</p>
        </div>
        <SignUp
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-zinc-900 border border-zinc-800 shadow-xl',
              headerTitle: 'font-heading text-foreground',
              headerSubtitle: 'font-mono text-zinc-400',
              formButtonPrimary: 'bg-lime-400 text-zinc-950 font-mono font-bold hover:bg-lime-300',
              formFieldInput: 'bg-zinc-800 border-zinc-700 text-foreground font-mono',
              formFieldLabel: 'font-mono text-zinc-300',
              footerActionLink: 'text-lime-400 font-mono',
            },
          }}
        />
      </div>
    </div>
  )
}
