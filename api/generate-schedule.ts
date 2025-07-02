
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Group, Cleaner } from '../src/types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Only POST requests are allowed' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error('GEMINI_API_KEY is not set in environment variables.');
        return res.status(500).json({ error: 'APIキーがサーバーに設定されていません。' });
    }

    try {
        const {
            numCleaners,
            cleaners, // Changed from cleanerNames
            groups,
            forbiddenPairs,
            desiredPairs,
            prevCombinations,
            specialRequests, // Added
        } = req.body;

        const prompt = `
あなたは清掃スケジュールの自動生成アシスタントです。
以下の条件に基づいて、最適な清掃員の組み合わせスケジュールを3案生成してください。

# 全体条件
- 総清掃員数: ${numCleaners}人
- 清掃員リストと役割: 
${cleaners.map((c: Cleaner) => `  - ${c.name} (${c.role || '役割なし'})`).join('\n')}

# グループ構成
${groups.map((g: Group) => `- グループ名: "${g.name}", 人数: ${g.size}人, 固定メンバー: [${g.fixedMembers.join(', ')}]`).join('\n')}

# 組み合わせ条件
- 特別なリクエスト: ${specialRequests || 'なし'}
- 組み合わせたくないペア: ${forbiddenPairs || 'なし'}
- 組み合わせたいペア: ${desiredPairs || 'なし'}
- 前回の組み合わせ（なるべく避ける）: ${prevCombinations[0] || 'なし'}
- 前々回の組み合わせ（なるべく避ける）: ${prevCombinations[1] || 'なし'}

# 重要ルール
- 全ての条件を厳密に守ってください。
- 全ての清掃員を必ずいずれか1つのグループに割り当ててください。
- 固定メンバーは必ず指定されたグループに所属させてください。
- グループの人数は必ず指定通りにしてください。

# 出力形式
以下のJSON形式で、3つの独立したスケジュール案（schedules配列の要素）を生成してください。
JSON以外の説明文や前置き、後書きは絶対に含めないでください。

\`\`\`json
{
  "schedules": [
    [
      { "name": "グループ名1", "members": ["メンバーA", "メンバーB"] },
      { "name": "グループ名2", "members": ["メンバーC", "メンバーD"] }
    ],
    [
      { "name": "グループ名1", "members": ["メンバーA", "メンバーC"] },
      { "name": "グループ名2", "members": ["メンバーB", "メンバーD"] }
    ],
    [
      { "name": "グループ名1", "members": ["メンバーA", "メンバーD"] },
      { "name": "グループ名2", "members": ["メンバーB", "メンバーC"] }
    ]
  ]
}
\`\`\`
`;
        
        const ai = new GoogleGenAI({ apiKey });
        const response: GenerateContentResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-preview-04-17',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
            }
        });

        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }

        const result = JSON.parse(jsonStr);
        return res.status(200).json(result);

    } catch (error) {
        console.error("Error in /api/generate-schedule:", error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ error: `AIの応答生成中にサーバーエラーが発生しました: ${errorMessage}` });
    }
}
