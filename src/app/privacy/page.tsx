import fs from "fs";
import path from "path";
import ReactMarkdown from "react-markdown";
import { Card, CardContent } from "../../components/ui/card";
import { PageHeader } from "../../components/ui/page-header";

const PrivacyPage = () => {
  const policyPath = path.resolve(process.cwd(), "../docs/privacy-policy.md");
  const markdown = fs.readFileSync(policyPath, "utf-8");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Legal"
        title="Privacy & data stewardship"
        subtitle="Plain-language overview of what we collect, why, and the rights you hold."
      />
      <Card>
        <CardContent>
          <article className="prose max-w-none prose-headings:text-slate-900 prose-li:marker:text-brand">
            <ReactMarkdown>{markdown}</ReactMarkdown>
          </article>
        </CardContent>
      </Card>
    </div>
  );
};

export default PrivacyPage;


