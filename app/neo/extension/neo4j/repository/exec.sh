alias tsx='pnpm dlx tsx'
for cmd in *.cmd.ts; do
	tsx ../reset-db.cmd.ts
	tsx $cmd > $(basename $cmd .ts).txt 2>&1
done
