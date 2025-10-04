import { cookies } from 'next/headers';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

if (!isDemoMode && (!supabaseUrl || !supabaseAnonKey)) {
  throw new Error('Supabase 환경 변수가 설정되지 않았습니다.');
}

export const createSupabaseServerClient = async () => {
  if (isDemoMode) {
    throw new Error('Demo 모드에서는 Supabase 클라이언트를 사용할 수 없습니다.');
  }

  const cookieStore = await cookies();

  return createServerClient(supabaseUrl!, supabaseAnonKey!, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        cookieStore.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        cookieStore.set({ name, value: '', ...options });
      },
    },
  });
};
