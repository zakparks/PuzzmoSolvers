// Trie-based dictionary for fast prefix checking
// This allows us to prune search paths early if they can't lead to valid words

class TrieNode {
  children: Map<string, TrieNode> = new Map();
  isWord: boolean = false;
}

class Trie {
  private root: TrieNode = new TrieNode();

  insert(word: string): void {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node.children.has(char)) {
        node.children.set(char, new TrieNode());
      }
      node = node.children.get(char)!;
    }
    node.isWord = true;
  }

  hasPrefix(prefix: string): boolean {
    let node = this.root;
    for (const char of prefix.toLowerCase()) {
      if (!node.children.has(char)) {
        return false;
      }
      node = node.children.get(char)!;
    }
    return true;
  }

  isWord(word: string): boolean {
    let node = this.root;
    for (const char of word.toLowerCase()) {
      if (!node.children.has(char)) {
        return false;
      }
      node = node.children.get(char)!;
    }
    return node.isWord;
  }
}

let dictionaryTrie: Trie | null = null;
let loadingPromise: Promise<Trie> | null = null;

/**
 * Loads the dictionary into a trie for fast prefix checking
 */
export async function loadDictionaryTrie(): Promise<Trie> {
  if (dictionaryTrie) {
    return dictionaryTrie;
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = (async () => {
    try {
      const response = await fetch('/words.txt');
      if (!response.ok) {
        throw new Error('Failed to load dictionary');
      }

      const text = await response.text();
      const words = text
        .split('\n')
        .map(word => word.trim().toLowerCase())
        .filter(word => word.length > 0);

      const trie = new Trie();
      for (const word of words) {
        trie.insert(word);
      }

      dictionaryTrie = trie;
      console.log(`Dictionary trie loaded with ${words.length} words`);
      return trie;
    } catch (error) {
      console.error('Error loading dictionary trie:', error);
      dictionaryTrie = new Trie();
      return dictionaryTrie;
    }
  })();

  return loadingPromise;
}

/**
 * Checks if a prefix could lead to a valid word
 * This is used to prune the search tree early
 */
export async function isValidPrefix(prefix: string): Promise<boolean> {
  const trie = await loadDictionaryTrie();
  return trie.hasPrefix(prefix);
}

/**
 * Checks if a word is valid in the dictionary
 */
export async function isValidWordTrie(word: string): Promise<boolean> {
  const trie = await loadDictionaryTrie();
  return trie.isWord(word);
}

/**
 * Preloads the dictionary trie
 */
export async function preloadDictionaryTrie(): Promise<void> {
  await loadDictionaryTrie();
}
