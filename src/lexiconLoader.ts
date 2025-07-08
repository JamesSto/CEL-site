import Papa from "papaparse";
import axios from "axios";

const axiosApi = axios.create({
  baseURL: import.meta.env.BASE_URL
});

export interface WordData {
  word: string;
  yesVotes: number;
  noVotes: number;
}

export interface LexiconData {
  lexicon: Map<string, WordData>;
  firstLetterMap: Map<string, Set<string>>;
}

export async function loadLexiconData(): Promise<LexiconData> {
  try {
    // Load both base CEL votes and user votes
    const [celResponse, userResponse] = await Promise.all([
      axiosApi.get('cel_votes.csv'),
      axiosApi.get('api/user_votes')
    ]);

    const celCsvText = celResponse.data;
    const userCsvText = userResponse.data;

    // Parse base CEL votes
    const baseLexicon = await parseCSV(celCsvText);
    
    // Parse user votes
    const userVotes = await parseCSV(userCsvText);

    // Merge base votes with user votes
    const combinedWordMap = new Map<string, WordData>();
    const letterMap = new Map<string, Set<string>>();

    // Start with all base words
    baseLexicon.forEach((wordData, word) => {
      const userVoteData = userVotes.get(word);
      const combinedYes = wordData.yesVotes + (userVoteData?.yesVotes || 0);
      const combinedNo = wordData.noVotes + (userVoteData?.noVotes || 0);
      
      combinedWordMap.set(word, { 
        word, 
        yesVotes: combinedYes, 
        noVotes: combinedNo 
      });

      addToLetterMap(letterMap, word);
    });

    // Add any user-voted words that aren't in base CEL
    userVotes.forEach((userVoteData, word) => {
      if (!baseLexicon.has(word)) {
        combinedWordMap.set(word, { 
          word, 
          yesVotes: userVoteData.yesVotes, 
          noVotes: userVoteData.noVotes 
        });

        addToLetterMap(letterMap, word);
      }
    });

    return {
      lexicon: combinedWordMap,
      firstLetterMap: letterMap
    };

  } catch (error) {
    console.error("Error loading lexicon data:", error);
    throw error;
  }
}

function parseCSV(csvText: string): Promise<Map<string, WordData>> {
  return new Promise((resolve, reject) => {
    const wordMap = new Map<string, WordData>();
    
    Papa.parse(csvText, {
      header: true,
      complete: (results) => {
        results.data.forEach((row: any) => {
          const word = row.word?.trim().toLowerCase();
          if (word) {
            const yesVotes = parseInt(row.yes_votes) || 0;
            const noVotes = parseInt(row.no_votes) || 0;
            wordMap.set(word, { word, yesVotes, noVotes });
          }
        });
        resolve(wordMap);
      },
      error: (error: any) => {
        reject(error);
      }
    });
  });
}

function addToLetterMap(letterMap: Map<string, Set<string>>, word: string) {
  const firstLetter = word[0];
  if (!letterMap.has(firstLetter)) {
    letterMap.set(firstLetter, new Set());
  }
  letterMap.get(firstLetter)!.add(word);
}