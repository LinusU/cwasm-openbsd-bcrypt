/**
 * Test a password against a previously computed hash.
 *
 * @param password The password to be checked.
 * @param hash The hash to be checked against.
 * @returns True if the password matches the hash, false otherwise.
 */
 export function compareSync (password: string, hash: string): boolean

 /**
  * Generate a salt.
  *
  * @param rounds The number of rounds to use when generating the salt.
  */
 export function genSaltSync (rounds: number): string

 /**
  * Generate a hash for the given password, using a random salt.
  *
  * @param password The password to hash.
  * @param rounds The number of rounds to use when generating the salt.
  */
 export function hashSync (password: string, rounds: number): string
