"use server";

import{
    
} from "@/actions/utils/user";

// export default async function Playground() {
//   const user_id = "64d2474a-2ac8-4775-ab5e-2c8a31bb037c";

//   //test react
//   // try {
//   //     const reaction = await reactToPost(new_user_id, post_id, reaction_type);
//   //     console.log("new reaction", reaction);

//   // } catch (error) {
//   //     console.error("Error during backend function calls", error);
//   // }

//   return (
//     <div>
//       <h1>Playground2</h1>
//       <p>Check console for output</p>
//     </div>
//   );
// }

export default function Login({
  searchParams,
}: {
  searchParams: { message: string };
}) {
  const signIn = async (formData: FormData) => {
    "use server";

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return redirect("/login?message=Could not authenticate user");
    }

    return redirect("/manage");
  };

  const signUp = async (formData: FormData) => {
    "use server";

    const origin = headers().get("origin");
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      return redirect("/login?message=Could not authenticate user");
    }

    await createProfile(data.user?.id as string);

    return redirect("/manage");
  };

  return (
    <div className='flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 pt-8'>
      <form className='animate-in flex-1 flex flex-col w-full justify-center gap-2 text-foreground'>
        <label className='text-md' htmlFor='email'>
          電子郵件
        </label>
        <input
          className='rounded-md px-4 py-2 bg-inherit border mb-6'
          name='email'
          placeholder='you@example.com'
          required
        />
        <label className='text-md' htmlFor='password'>
          密碼
        </label>
        <input
          className='rounded-md px-4 py-2 bg-inherit border mb-6'
          type='password'
          name='password'
          placeholder='••••••••'
          required
        />
        <SubmitButton
          formAction={signIn}
          className='bg-green-700 rounded-md px-4 py-2 text-foreground mb-2'
          pendingText='Signing In...'
        >
          登入
        </SubmitButton>
        <SubmitButton
          formAction={signUp}
          className='border border-foreground/20 rounded-md px-4 py-2 text-foreground mb-2'
          pendingText='Signing Up...'
        >
          註冊
        </SubmitButton>
        {searchParams?.message && (
          <p className='mt-4 p-4 bg-foreground/10 text-foreground text-center'>
            {searchParams.message}
          </p>
        )}
      </form>
    </div>
  );
}

