"use server";

import { OrganizationRepository } from "@repo/core";
import { revalidatePath } from "next/cache";

export async function listOrganizations() {
  return await OrganizationRepository.list();
}

export async function createOrganization(formData: FormData) {
  const name = formData.get("name") as string;
  if (!name) throw new Error("Name is required");

  await OrganizationRepository.create({ name });
  revalidatePath("/");
}

export async function rotateApiKey(orgId: string) {
  await OrganizationRepository.rotateKey(orgId);
  revalidatePath(`/orgs/${orgId}`);
}

export async function updateAllowedIps(orgId: string, ips: string[]) {
  await OrganizationRepository.update(orgId, { allowedIps: ips });
  revalidatePath(`/orgs/${orgId}`);
}
