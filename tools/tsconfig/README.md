# `tsconfig`

These are base shared `tsconfig.json`s from which all other `tsconfig.json`'s inherit from.

By default we target module ESNext with resolution of form bundler. The reason for this is because packages built here are mainly for use in Minecraft where we have ESM support and no need for file extensions.