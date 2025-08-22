'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Lock, Trash2, Loader2, Shield, AlertCircle } from 'lucide-react';
import { useActionState, useState, useEffect } from 'react';
import { updatePassword, deleteAccount, setPassword } from '@/app/(login)/actions';
import useSWR, { mutate } from 'swr';
import { User } from '@/lib/db/schema';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type PasswordState = {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  error?: string;
  success?: string;
};

type SetPasswordState = {
  newPassword?: string;
  confirmPassword?: string;
  error?: string;
  success?: string;
};

type DeleteState = {
  password?: string;
  error?: string;
  success?: string;
};

export default function SecurityPage() {
  const { data: user } = useSWR<User>('/api/user', fetcher);
  const isOAuthUser = user?.authProvider === 'google' && !user?.passwordHash;
  const [isSettingPassword, setIsSettingPassword] = useState(false);
  
  const [passwordState, passwordAction, isPasswordPending] = useActionState<
    PasswordState,
    FormData
  >(updatePassword, {});

  const [setPasswordState, setPasswordAction, isSetPasswordPending] = useActionState<
    SetPasswordState,
    FormData
  >(setPassword, {});

  const [deleteState, deleteAction, isDeletePending] = useActionState<
    DeleteState,
    FormData
  >(deleteAccount, {});

  // Hide password form and refresh user data on success
  useEffect(() => {
    if (setPasswordState.success) {
      setIsSettingPassword(false);
      mutate('/api/user'); // Refresh user data to show updated authProvider
    }
  }, [setPasswordState.success]);

  return (
    <section className="flex-1 p-4 lg:p-8">
      <h1 className="text-lg lg:text-2xl font-medium bold text-gray-900 mb-6">
        Security Settings
      </h1>
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Password</CardTitle>
        </CardHeader>
        <CardContent>
          {isOAuthUser ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Shield className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-blue-900">
                    Google Account
                  </p>
                  <p className="text-sm text-blue-700">
                    Your account is secured through Google OAuth. Password management is not available for Google accounts.
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>• Your account is automatically secured through Google's authentication</p>
                <p>• No password to remember or manage</p>
                <p>• Enhanced security with Google's 2FA and security features</p>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-700 mb-3">
                  Want to add password authentication or delete your account?
                </p>
                <Button
                  type="button"
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50"
                  onClick={() => setIsSettingPassword(true)}
                >
                  Set Password
                </Button>
              </div>
              
              {isSettingPassword && (
                <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Set Password for Account Deletion</h4>
                  <form className="space-y-4" action={setPasswordAction}>
                    <input type="hidden" name="isOAuthUser" value="true" />
                    <div>
                      <Label htmlFor="new-password-oauth" className="mb-2">
                        New Password
                      </Label>
                      <Input
                        id="new-password-oauth"
                        name="newPassword"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        maxLength={100}
                        placeholder="Enter new password"
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirm-password-oauth" className="mb-2">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirm-password-oauth"
                        name="confirmPassword"
                        type="password"
                        required
                        minLength={8}
                        maxLength={100}
                        placeholder="Confirm new password"
                      />
                    </div>
                    {setPasswordState.error && (
                      <p className="text-red-500 text-sm">{setPasswordState.error}</p>
                    )}
                    {setPasswordState.success && (
                      <p className="text-green-500 text-sm">{setPasswordState.success}</p>
                    )}
                    <div className="flex space-x-3">
                      <Button
                        type="submit"
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                        disabled={isSetPasswordPending}
                      >
                        {isSetPasswordPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Setting Password...
                          </>
                        ) : (
                          <>
                            <Lock className="mr-2 h-4 w-4" />
                            Set Password
                          </>
                          )}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsSettingPassword(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <form className="space-y-4" action={passwordAction}>
              <div>
                <Label htmlFor="current-password" className="mb-2">
                  Current Password
                </Label>
                <Input
                  id="current-password"
                  name="currentPassword"
                  type="password"
                  autoComplete="current-password"
                  required
                  minLength={8}
                  maxLength={100}
                  defaultValue={passwordState.currentPassword}
                />
              </div>
              <div>
                <Label htmlFor="new-password" className="mb-2">
                  New Password
                </Label>
                <Input
                  id="new-password"
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  maxLength={100}
                  defaultValue={passwordState.newPassword}
                />
              </div>
              <div>
                <Label htmlFor="confirm-password" className="mb-2">
                  Confirm New Password
                </Label>
                <Input
                  id="confirm-password"
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={8}
                  maxLength={100}
                  defaultValue={passwordState.confirmPassword}
                />
              </div>
              {passwordState.error && (
                <p className="text-red-500 text-sm">{passwordState.error}</p>
              )}
              {passwordState.success && (
                <p className="text-green-500 text-sm">{passwordState.success}</p>
              )}
              <Button
                type="submit"
                className="bg-orange-500 hover:bg-orange-600 text-white"
                disabled={isPasswordPending}
              >
                {isPasswordPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delete Account</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500 mb-4">
            Account deletion is non-reversable. Please proceed with caution.
          </p>
          {isOAuthUser && !user?.passwordHash ? (
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="text-sm font-medium text-amber-900">
                    Google Account Deletion
                  </p>
                  <p className="text-sm text-amber-700">
                    Set a password first to enable account deletion.
                  </p>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                <p>• Google OAuth accounts need a password to use the delete form</p>
                <p>• Use the "Set Password" button above to add password authentication</p>
                <p>• Once you have a password, you can delete your account normally</p>
                <p>• Your data will be permanently removed upon deletion</p>
              </div>
            </div>
          ) : (
            <form action={deleteAction} className="space-y-4">
              <div>
                <Label htmlFor="delete-password" className="mb-2">
                  Confirm Password
                </Label>
                <Input
                  id="delete-password"
                  name="password"
                  type="password"
                  required
                  minLength={8}
                  maxLength={100}
                  defaultValue={deleteState.password}
                />
              </div>
              {deleteState.error && (
                <p className="text-red-500 text-sm">{deleteState.error}</p>
              )}
              <Button
                type="submit"
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
                disabled={isDeletePending}
              >
                {isDeletePending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </>
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
