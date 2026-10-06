import { Browser } from '@/components/browser';
import { CATEGORIES } from '@/lib/catalog';
import { notFound } from 'next/navigation';
export default async function CategoryPage({params}:{params:Promise<{category:string}>}){const {category}=await params;if(!(category in CATEGORIES))notFound();return <Browser initialCategory={category}/>;}
