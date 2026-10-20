"use server"

import { Button } from "@/components/ui/button"

type PatientType = {
  name: string,
  age: number,
  id : String
};

type Props = {
  params: Promise<PatientType>;
};

export default async function Page({ params }: Props) {
  console.log(((await params).id));
  
  
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        patient
      </div>
    </div>
  )
}
