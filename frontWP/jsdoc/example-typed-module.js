// @ts-check
/// <reference path="./types.js" />

/**
 * Example: how typed wrappers improve DX in an admin module.
 *
 * Before (no types):
 *   const data = await shell.gqlRequest(QUERY);
 *   // IDE has no idea what data.adminPosts contains
 *   data.adminPosts.forEach(post => post.??? // no autocomplete
 *
 * After (with types):
 *   const posts = await fetchAdminPosts(shell);
 *   posts.forEach(post => post. // IDE shows: ID, post_title, post_status, author, ...
 */

import { fetchAdminPosts, createPost, updatePost, deletePost } from
  '../adminWP/shared/js/api-helpers.js';

/**
 * Example module demonstrating typed GraphQL usage.
 *
 * @param {HTMLElement} content - The content container
 * @param {Object} shell - AdminShell instance
 */
export default async function exampleTypedModule(content, shell) {
  // fetchAdminPosts returns Promise<Array<WpPost>>
  // IDE will autocomplete all WpPost fields
  const posts = await fetchAdminPosts(shell, { status: 'draft' });

  posts.forEach(
    /**
     * @param {WpPost} post - IDE knows this is a WpPost
     */
    (post) => {
      // IDE autocompletes: post.ID, post.post_title, post.post_status,
      // post.post_content, post.post_date, post.author
      console.log(`${post.ID}: ${post.post_title} (${post.post_status})`);
      console.log(`Author: ${post.author?.display_name}`);
    }
  );

  // createPost returns Promise<PostMutationResult>
  // IDE knows result has { post: WpPost | null, errors: string[] }
  const result = await createPost(shell, {
    title: 'New Post',
    content: 'Hello world',
    status: 'draft'
  });

  if (result.errors.length) {
    // result.errors is typed as Array<string>
    shell.showToast(result.errors[0], 'error');
  } else {
    // result.post is typed as WpPost | null
    shell.showToast(`Created: ${result.post?.post_title}`, 'success');
  }
}

/*
 * Benefits summary:
 * - IDE shows field names when typing `post.` after a WpPost variable
 * - TypeScript-style errors in VS Code if you pass wrong types (with ts-check)
 * - `rake jsdoc:generate` keeps types in sync when schema evolves
 * - Zero runtime overhead — all annotations are comments
 */
