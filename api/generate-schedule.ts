import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import type { VercelRequest, VercelResponse } from '@vercel/node';

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
            cleanerNames,
            groups,
            forbiddenPairs,
            desiredPairs,
            prevCombinations,
        } = req.body;

        const prompt = `
あなたは清掃スケジュールの自動生成アシスタントです。
以下の条件に基づいて、最適な清掃員の組み合わせスケジュールを3案生成してください。

# 全体条件
- 総清掃員数: ${numCleaners}人
- 清掃員リスト: ${cleanerNames.join(', ')}

# グループ構成
${groups.map((g: {name: string, size: number, fixedMembers: string[]}) => `- グループ名: "${g.name}", 人数: ${g.size}人, 固定メンバー: [${g.fixedMembers.join(', ')}]`).join('\n')}

# 組み合わせ条件
- 組み合わせたくないペア: ${forbiddenPairs || 'なし'}
- 組み合わせたいペア: ${desiredPairs || 'なし'}
- 前回の組み合わせ（なるべく避ける）: ${prevCombinations[0] || 'なし'}
- 前々回の組み合わせ（なるべく避ける）: ${prevCombinations[1] || 'なし'}

# 出力形式
以下のJSON形式で、3つの独立したスケジュール案（schedules配列の要素）を生成してください。
各メンバーは必ずいずれか1つのグループに所属させてください。
固定メンバーは必ず指定されたグループに入れてください。
JSON以外の説明文は絶対に含めないでください。

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
        // エラーオブジェクトからより詳細な情報を取得しようと試みる
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return res.status(500).json({ error: `AIの応答生成中にサーバーエラーが発生しました: ${errorMessage}` });
    }
}