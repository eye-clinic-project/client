import React, { useState } from 'react'
import axios from 'axios'
import { Paperclip, Upload } from 'lucide-react'
import { AppSidebar } from "@/components/blocks/app-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"


export default function Panel() {
    const [file, setFile] = useState<File | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [message, setMessage] = useState('')
    const [isError, setIsError] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        const form = event.currentTarget
        if (!file) {
            setMessage('Choose an image to upload.')
            setIsError(true)
            return
        }

        const formData = new FormData()
        formData.append('file', file)
        setIsUploading(true)
        setMessage('')
        
        try {
            const result = await axios.post('http://127.0.0.1:3000/ai/upload-image', formData)
            console.log(result.data);
            
            setMessage('Your image was uploaded successfully.')
            setIsError(false)
            setFile(null)
            form.reset()
        } catch (error) {
            let errorMessage = 'Unable to upload the image. Please try again.'
            if (axios.isAxiosError<{ message?: string | string[] }>(error)) {
                const apiMessage = error.response?.data?.message
                if (typeof apiMessage === 'string') {
                    errorMessage = apiMessage
                } else if (Array.isArray(apiMessage)) {
                    errorMessage = apiMessage.join(', ')
                }
            }
            setMessage(errorMessage)
            setIsError(true)
        } finally {
            setIsUploading(false)
        }
    }

    return (
        <React.Fragment>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1" />
                            <Separator
                                orientation="vertical"
                                className="mr-2 data-[orientation=vertical]:h-4"
                            />
                            <Breadcrumb>
                                <BreadcrumbList>
                                    <BreadcrumbItem className="hidden md:block">
                                        <BreadcrumbLink href="#">
                                            Build Your Application
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                    <BreadcrumbSeparator className="hidden md:block" />
                                    <BreadcrumbItem>
                                        <BreadcrumbPage>Data Fetching</BreadcrumbPage>
                                    </BreadcrumbItem>
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 p-4 pt-0 w-full justify-center align-middle">
                        <div className="mx-auto w-full max-w-2xl rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
                            <div className="mb-6">
                                <div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-muted">
                                    <Paperclip aria-hidden="true" className="size-5" />
                                </div>
                                <h1 className="text-xl font-semibold">Upload an attachment</h1>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Choose an image to upload for analysis.
                                </p>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="attachment" className="text-sm font-medium">
                                        Image
                                    </label>
                                    <Input
                                        id="attachment"
                                        type="file"
                                        accept="image/*"
                                        required
                                        onChange={(event) => {
                                            setFile(event.target.files?.[0] ?? null)
                                            setMessage('')
                                        }}
                                        aria-describedby="attachment-help"
                                    />
                                    <p id="attachment-help" className="text-sm text-muted-foreground">
                                        Select an image file from your device.
                                    </p>
                                </div>
                                {file && (
                                    <p className="truncate text-sm text-muted-foreground">
                                        Selected: {file.name}
                                    </p>
                                )}
                                <Button type="submit" disabled={!file || isUploading}>
                                    <Upload aria-hidden="true" />
                                    {isUploading ? 'Uploading…' : 'Upload image'}
                                </Button>
                                {message && (
                                    <p
                                        role={isError ? 'alert' : 'status'}
                                        className={`text-sm ${isError ? 'text-destructive' : 'text-muted-foreground'}`}
                                    >
                                        {message}
                                    </p>
                                )}
                            </form>
                        </div>
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </React.Fragment>
    )
}

