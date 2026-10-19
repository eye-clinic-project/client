import { SignupForm } from '@/components/blocks/signup-form';
import React from 'react'

export default function SignUp() {
    return (
        <React.Fragment>
            <main className="grid min-h-screen place-items-center px-4 py-10">
                <SignupForm className="w-full max-w-md" />
            </main>
        </React.Fragment>
    )
}
