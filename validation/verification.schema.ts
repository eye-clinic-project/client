import { z } from "zod"

import { licenseDocuments, requiredText } from "./common.schema"

export const licenseSchema = z
  .object({ licenseNumber: requiredText(50), documents: licenseDocuments })
  .transform(({ licenseNumber, documents }) => {
    const body = new FormData()
    body.set("licenseNumber", licenseNumber)
    for (const file of documents) body.append("documents", file)
    return body
  })
