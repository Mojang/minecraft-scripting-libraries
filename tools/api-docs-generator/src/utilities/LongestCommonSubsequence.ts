// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

export type GenericObject = Record<string, unknown>;

// https://en.wikipedia.org/wiki/Longest_common_subsequence
// returns the longest common subsequence of the two arrays (returns the keys)
// this can be used to generate additions and removals as everything that is returned from this
// is the key of common elements found in both arrays
export function longestCommonSubsequence(oldArray: GenericObject[], newArray: GenericObject[], key: string) {
    // create LCS comparison array initialized to 0
    const c = new Array(oldArray.length + 1) as number[][];
    for (let i = 0; i < c.length; ++i) {
        c[i] = new Array(newArray.length + 1) as number[];
        for (let j = 0; j < c[i].length; ++j) {
            c[i][j] = 0;
        }
    }

    for (let i = 1; i <= oldArray.length; ++i) {
        for (let j = 1; j <= newArray.length; ++j) {
            if (oldArray[i - 1][key] === newArray[j - 1][key]) {
                c[i][j] = c[i - 1][j - 1] + 1;
            } else {
                c[i][j] = Math.max(c[i][j - 1], c[i - 1][j]);
            }
        }
    }

    // backtrack to build LCS values (we backtrace because the matrix traversal starts
    // from the end which represents the longest of the common subsequences)
    let i = oldArray.length;
    let j = newArray.length;
    const ret: unknown[] = [];
    while (i !== 0 && j !== 0) {
        if (oldArray[i - 1][key] === newArray[j - 1][key]) {
            ret.push(oldArray[i - 1][key]);
            i -= 1;
            j -= 1;
        }
        // this helps us traverse the matrix by finding the next largest LCS at the current point
        else if (c[i][j - 1] > c[i - 1][j]) {
            j -= 1;
        } else {
            i -= 1;
        }
    }

    // the return value we constructed is backwards because we traversed the matrix backwards, so we reverse this
    return ret.reverse();
}

// https://en.wikipedia.org/wiki/Diff
// Using the LCS from above, we can see what was removed from oldArray as objects not found in the LCS
// and what was added are objects in newArray not found in LCS
// key is the object we are comparing with
// returns an array holding the diffed information the following format:
// array: [
//    {
//        "key": "name",
//        ...
//    },
//    {
//        "key": "name",
//        "$added": true,
//        ...
//    },
//    {
//        "key": "name",
//        "$removed": true,
//        ...
//    },
//]
export function diffArray(oldArray: GenericObject[] | undefined, newArray: GenericObject[] | undefined, key: string) {
    const oldArrayOrEmpty: GenericObject[] = oldArray ?? [];
    const newArrayOrEmpty: GenericObject[] = newArray ?? [];
    const lcs = longestCommonSubsequence(oldArrayOrEmpty, newArrayOrEmpty, key);
    let i = 0;
    let j = 0;
    const ret: GenericObject[] = [];

    const makeRemoval = (item: GenericObject) => {
        const objectRemoved = {
            ...item,
            $removed: true,
        };
        ret.push(objectRemoved);
        ++i;
    };
    const makeAddition = (item: GenericObject) => {
        const objectAdded = {
            ...item,
            $added: true,
        };
        ret.push(objectAdded);
        ++j;
    };

    // lcs is sorted against both arrays, so we can safely traverse each array
    // up until we find the common element
    for (const common of lcs) {
        // removals, things in old but not in new or common up to our current common
        while (i < oldArrayOrEmpty.length && common !== oldArrayOrEmpty[i][key]) {
            makeRemoval(oldArrayOrEmpty[i]);
        }

        // additions, things in new but not in common or old up to our current common
        while (j < newArrayOrEmpty.length && common !== newArrayOrEmpty[j][key]) {
            makeAddition(newArrayOrEmpty[j]);
        }

        // finally add the common element
        ret.push(oldArrayOrEmpty[i]);
        ++i;
        ++j;
    }

    // add any remaining removals
    while (i < oldArrayOrEmpty.length) {
        makeRemoval(oldArrayOrEmpty[i]);
    }
    // add any remaining additions
    while (j < newArrayOrEmpty.length) {
        makeAddition(newArrayOrEmpty[j]);
    }

    // final array complete
    return ret;
}
