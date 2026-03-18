import { updatePassword } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function UpdatePasswordPage(props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const searchParams = await props.searchParams
  const message = typeof searchParams?.message === 'string' ? searchParams.message : undefined;

  return (
    <div className="flex h-screen w-full items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Update Password</CardTitle>
          <CardDescription>
            Enter your brand new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
              />
            </div>
            
            {message && (
              <p className="text-sm font-medium text-destructive">{message}</p>
            )}

            <Button
              formAction={updatePassword}
              type="submit"
              className="w-full font-semibold"
            >
              Update Password
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
