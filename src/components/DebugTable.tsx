import { type Message } from '../lib/parser';
import { tagMessage } from '../lib/engine';

export function DebugTable({ messages, currentUser }: { messages: Message[], currentUser: string }) {
  if (!messages || messages.length === 0) return null;

  return (
    <div className="w-full max-w-7xl mt-8 overflow-x-auto bg-[#1f2937] border border-[#374151] rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-8 duration-700">
      <h3 className="text-xl font-bold mb-4 text-[#f9fafb] flex items-center justify-between">
        Debug Table
        <span className="text-xs font-mono text-[#9ca3af] bg-[#111827] px-2 py-1 rounded">
          {messages.length} messages
        </span>
      </h3>
      <table className="w-full text-sm text-left text-[#9ca3af]">
        <thead className="text-xs uppercase bg-[#374151] text-[#f9fafb]">
          <tr>
            <th className="px-4 py-3 rounded-tl-lg">Sender</th>
            <th className="px-4 py-3">Message</th>
            <th className="px-4 py-3">Tags</th>
            <th className="px-4 py-3 rounded-tr-lg">Deadline</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#374151]">
          {messages.slice(0, 100).map((msg) => {
            const tags = tagMessage(msg, currentUser, messages);
            const activeTags = Object.entries(tags)
              .filter(([key, val]) => val === true && key !== 'deadlineDate' && key !== 'matchedPhrases')
              .map(([key]) => key);
            
            return (
              <tr key={msg.id} className="hover:bg-[#374151]/50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-[#f9fafb] font-medium">{msg.sender}</td>
                <td className="px-4 py-3 max-w-[20rem] truncate">{msg.text}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {activeTags.map(t => (
                      <span key={t} className="px-2 py-0.5 bg-[#10b981]/20 text-[#10b981] rounded text-xs uppercase font-semibold">
                        {t}
                      </span>
                    ))}
                    {tags.matchedPhrases.length > 0 && (
                      <span className="text-xs text-gray-500 whitespace-nowrap"> ({tags.matchedPhrases.join(', ')})</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {tags.deadlineDate ? tags.deadlineDate.toLocaleString() : '-'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {messages.length > 100 && (
        <p className="text-center text-sm text-gray-500 mt-4">Showing first 100 messages.</p>
      )}
    </div>
  );
}
