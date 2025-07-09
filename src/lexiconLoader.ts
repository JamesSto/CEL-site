import Papa from "papaparse";
import axios from "axios";
import { getUserIdentifier } from "./userIdentification";

export const CEL_VOTE_WORTH = 5;

const axiosApi = axios.create({
  baseURL: import.meta.env.BASE_URL
});

export interface WordData {
  word: string;
  yesVotes: number;
  noVotes: number;
  userVote?: 'yes' | 'no' | '';
  isInOriginalCEL: boolean;
}

export interface LexiconData {
  lexicon: Map<string, WordData>;
}

export async function loadLexiconData(): Promise<LexiconData> {
  try {
    const userIdentifier = getUserIdentifier();
    
    // Load both base CEL votes and user votes (with user-specific data)
    const [celResponse, userResponse] = await Promise.all([
      axiosApi.get('cel_votes.csv'),
      axiosApi.get('api/user_votes', { 
        params: { user_identifier: userIdentifier } 
      })
    ]);

    const celCsvText = celResponse.data;
    const userCsvText = userResponse.data;

    // Parse base CEL votes
    const baseLexicon = await parseCSV(celCsvText);
    
    // Parse user votes (includes user-specific vote data)
    const userVotes = await parseUserVotesCSV(userCsvText);

    // Merge base votes with user votes
    const combinedWordMap = new Map<string, WordData>();

    // Start with all base words
    baseLexicon.forEach((wordData, word) => {
      const userVoteData = userVotes.get(word);
      const combinedYes = wordData.yesVotes + (userVoteData?.yesVotes || 0);
      const combinedNo = wordData.noVotes + (userVoteData?.noVotes || 0);
      
      combinedWordMap.set(word, { 
        word, 
        yesVotes: combinedYes, 
        noVotes: combinedNo,
        userVote: userVoteData?.userVote || '',
        isInOriginalCEL: true
      });
    });

    // Add any user-voted words that aren't in base CEL
    userVotes.forEach((userVoteData, word) => {
      if (!baseLexicon.has(word)) {
        combinedWordMap.set(word, { 
          word, 
          yesVotes: userVoteData.yesVotes, 
          noVotes: userVoteData.noVotes + CEL_VOTE_WORTH,
          userVote: userVoteData.userVote || '',
          isInOriginalCEL: false
        });
      }
    });

    return {
      lexicon: combinedWordMap
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
            wordMap.set(word, { word, yesVotes, noVotes, isInOriginalCEL: true });
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

function parseUserVotesCSV(csvText: string): Promise<Map<string, WordData>> {
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
            const userVote = row.user_vote?.trim() || '';
            wordMap.set(word, { word, yesVotes, noVotes, userVote, isInOriginalCEL: false });
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


export async function submitVote(word: string, vote: 'yes' | 'no'): Promise<void> {
  try {
    const userIdentifier = getUserIdentifier();
    
    const response = await axiosApi.post('api/vote', {
      word: word.toLowerCase().trim(),
      vote: vote,
      user_identifier: userIdentifier
    });

    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Vote submission failed');
    }

    console.log(`Vote submitted: ${word} - ${vote}`);
  } catch (error) {
    console.error('Error submitting vote:', error);
    throw error;
  }
}

export async function removeVote(word: string): Promise<void> {
  try {
    const userIdentifier = getUserIdentifier();
    
    const response = await axiosApi.delete('api/vote', {
      data: {
        word: word.toLowerCase().trim(),
        user_identifier: userIdentifier
      }
    });

    if (response.data.status !== 'success') {
      throw new Error(response.data.message || 'Vote removal failed');
    }

    console.log(`Vote removed: ${word}`);
  } catch (error) {
    console.error('Error removing vote:', error);
    throw error;
  }
}
