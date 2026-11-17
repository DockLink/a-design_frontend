import re

with open("hooks/use-task-hold-requests.ts", "r") as f:
    content = f.read()

# Add import
import_stmt = 'import { useAuth } from "@/hooks/use-auth";\n'
content = re.sub(r'(import type \{)', import_stmt + r'\1', content)

# Add useAuth hook call
hook_call = '  const { user } = useAuth();\n  const [holds, setHolds] = useState<TaskableHoldRequest[]>([]);'
content = content.replace('  const [holds, setHolds] = useState<TaskableHoldRequest[]>([]);', hook_call)

# Fix pendingHold
content = content.replace('&& h.requestedById === currentUserId) ?? null,\n    [holds]', '&& h.requestedById === user?.id) ?? null,\n    [holds, user?.id]')

with open("hooks/use-task-hold-requests.ts", "w") as f:
    f.write(content)
