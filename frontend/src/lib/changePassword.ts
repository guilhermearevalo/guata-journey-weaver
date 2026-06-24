import { supabase } from '@/integrations/supabase/client';

export type ChangePasswordInput = {
  newPassword: string;
  confirmPassword: string;
  currentPassword?: string;
  email?: string;
};

export function validatePasswordInput(input: ChangePasswordInput): string | null {
  if (input.newPassword.length < 8) {
    return 'A nova senha deve ter pelo menos 8 caracteres.';
  }
  if (input.newPassword !== input.confirmPassword) {
    return 'As senhas não conferem.';
  }
  return null;
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  const validationError = validatePasswordInput(input);
  if (validationError) throw new Error(validationError);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) throw new Error('Sessão inválida. Faça login novamente.');

  if (input.currentPassword) {
    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: input.email ?? user.email,
      password: input.currentPassword,
    });
    if (reauthError) throw new Error('Senha atual incorreta.');
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: input.newPassword,
  });
  if (updateError) throw updateError;

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ must_change_password: false })
    .eq('user_id', user.id);

  if (profileError) throw profileError;
}
