import { Suspense } from 'react';
import Image from 'next/image';
import Header from '@/components/Header';
import GameCard, { Game } from '@/components/GameCard';
import LoadingGrid from '@/components/LoadingGrid';
import { Building2 } from 'lucide-react';
import { Metadata } from 'next';

export const dynamic = 'force-dynamic';

interface CompanyData {
    id: number;
    name: string;
    description: string;
    logoUrl: string | null;
    games: Game[];
}

async function getCompanyData(id: string): Promise<CompanyData | null> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    try {
        const res = await fetch(`${baseUrl}/api/company/${id}`, {
            cache: 'no-store',
        });

        if (!res.ok) {
            if (res.status === 404) return null;
            throw new Error(`Failed to fetch company data: ${res.status}`);
        }

        return res.json();
    } catch (error) {
        console.error("Error fetching company page data:", error);
        return null;
    }
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const resolvedParams = await params;
    const company = await getCompanyData(resolvedParams.id);

    if (!company) {
        return {
            title: 'Company Not Found - GameTrack',
            description: 'This developer or publisher could not be found in our database.',
        };
    }

    const cleanDescription = company.description
        ? company.description.split('\n')[0].substring(0, 160) + (company.description.length > 160 ? '...' : '')
        : `Check out games developed and published by ${company.name} on GameTrack.`;

    return {
        title: `${company.name} Games & Details - GameTrack`,
        description: cleanDescription,
        openGraph: {
            title: `${company.name} - GameTrack`,
            description: cleanDescription,
            url: `https://gametrack.app/company/${company.id}`,
            siteName: 'GameTrack',
            images: company.logoUrl ? [{ url: company.logoUrl, width: 400, height: 400, alt: `${company.name} logo` }] : [],
            type: 'website',
        },
        twitter: {
            card: 'summary',
            title: `${company.name} - GameTrack`,
            description: cleanDescription,
            images: company.logoUrl ? [company.logoUrl] : [],
        },
    };
}

async function CompanyDetails({ id }: { id: string }) {
    const company = await getCompanyData(id);

    if (!company) {
        return (
            <div className="flex flex-col items-center justify-center p-16 text-center bg-surface border border-border rounded-2xl shadow-sm">
                <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mb-6">
                    <Building2 className="w-8 h-8 text-foreground/30" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Company Not Found</h2>
                <p className="text-foreground/70 max-w-sm mx-auto">
                    We couldn&apos;t find any details for this company. They might not exist in our database.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="mb-12 bg-surface border border-border rounded-2xl p-8 flex flex-col md:flex-row items-center md:items-start gap-8 shadow-sm">
                {company.logoUrl ? (
                    <div className="w-48 h-48 relative shrink-0 bg-white rounded-xl p-4 flex items-center justify-center shadow-inner overflow-hidden">
                        <Image
                            src={company.logoUrl}
                            alt={`${company.name} logo`}
                            fill
                            className="object-contain p-4"
                            unoptimized
                        />
                    </div>
                ) : (
                    <div className="w-48 h-48 shrink-0 bg-background rounded-xl flex items-center justify-center shadow-inner">
                        <Building2 className="w-16 h-16 text-foreground/20" />
                    </div>
                )}

                <div className="flex-1 text-center md:text-left">
                    <h1 className="text-4xl font-bold tracking-tight mb-4">{company.name}</h1>
                    <p className="text-foreground/80 leading-relaxed max-w-3xl whitespace-pre-wrap">
                        {company.description}
                    </p>
                </div>
            </div>

            <div className="mb-8">
                <h2 className="text-2xl font-bold border-l-4 border-primary pl-4 mb-2">Published & Developed Games</h2>
                <p className="text-foreground/70 mb-6">Games associated with {company.name}</p>

                {company.games.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 sm:gap-6">
                        {company.games.map((game) => (
                            <GameCard key={game.id} game={game} />
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center bg-surface border border-border rounded-xl">
                        <p className="text-foreground/70">No games found for this company.</p>
                    </div>
                )}
            </div>
        </>
    );
}

export default async function CompanyPage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;

    return (
        <>
            <Header />
            <main className="flex-1 container mx-auto px-4 py-8 max-w-[2000px] w-full">
                <Suspense fallback={<LoadingGrid />}>
                    <CompanyDetails id={params.id} />
                </Suspense>
            </main>
        </>
    );
}
