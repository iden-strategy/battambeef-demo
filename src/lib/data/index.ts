// The only way components read content. Later phases swap these bodies for Supabase queries,
// so keep them async-compatible in spirit: components should not reach into the arrays directly.

import type { CowPartId } from "@/lib/data/cow-map";
import { COW_PARTS, COW_SILHOUETTE, CUT_MAP_IMAGE } from "@/lib/data/cow-map";
import { COOKING_METHODS, CUT_TIERS, CUTS, type Cut } from "@/lib/data/cuts";
import { BUSINESS_POINTS, FEATURED_CUT_IDS, HERO_IMAGES, HOME_JOURNEY_STAGE_IDS, STATEMENT_PILLS } from "@/lib/data/home";
import { ABOUT_IMAGES, VALUES } from "@/lib/data/about";
import { BUSINESS_TYPES, OFFERS, STEPS, WEEKLY_VOLUMES, WHY_POINTS } from "@/lib/data/business";
import { FAQ, FEATURED_RECIPE_IDS, GUIDE_METHODS, QUICK_LINKS, RECIPES, STORAGE_CARDS, type Recipe } from "@/lib/data/knowledge";
import { BRAND_COLORS } from "@/lib/data/brand";
import { CHILL_HOURS, CHILL_POINTS, JOURNEY_IMAGE_RATIO, JOURNEY_RESULTS, JOURNEY_STAGES } from "@/lib/data/journey";
import {
  buildQuickActions,
  CONTACT_CARDS,
  CONTACT_DETAILS,
  COPYRIGHT_YEAR,
  ENQUIRY_TYPES,
  NAV_ITEMS,
  OG_IMAGE,
  SOCIAL_LINKS,
} from "@/lib/data/site";

export const getNavItems = () => NAV_ITEMS;
export const getCopyrightYear = () => COPYRIGHT_YEAR;
export const getContactDetails = () => CONTACT_DETAILS;
export const getSocialLinks = () => SOCIAL_LINKS;
export const getQuickActions = () => buildQuickActions();
export const getContactCards = () => CONTACT_CARDS;
export const getEnquiryTypes = () => ENQUIRY_TYPES;
export const getOgImage = () => OG_IMAGE;

export const getCuts = () => CUTS;
export const getCutById = (id: string) => CUTS.find((c) => c.id === id);
export const getCutsByPart = (part: CowPartId) => CUTS.filter((c) => c.part === part);
export const getCutsByMethod = (method: Cut["methods"][number]) => CUTS.filter((c) => c.methods.includes(method));
export const getCookingMethods = () => COOKING_METHODS;
export const getCutTiers = () => CUT_TIERS;
export const getCowMap = () => ({ image: CUT_MAP_IMAGE, silhouette: COW_SILHOUETTE, parts: COW_PARTS });

export const getBrandColors = () => BRAND_COLORS;

export const getJourneyStages = () => JOURNEY_STAGES;
export const getJourneyImageRatio = () => JOURNEY_IMAGE_RATIO;
export const getChillHours = () => CHILL_HOURS;
export const getChillPoints = () => CHILL_POINTS;
export const getJourneyResults = () => JOURNEY_RESULTS;

export const getHeroImages = () => HERO_IMAGES;
export const getStatementPills = () => STATEMENT_PILLS;
export const getFeaturedCuts = () => FEATURED_CUT_IDS.map((id) => CUTS.find((c) => c.id === id)).filter((c): c is Cut => !!c);
export const getHomeJourneyStages = () => JOURNEY_STAGES.filter((s) => HOME_JOURNEY_STAGE_IDS.includes(s.id));
export const getBusinessPoints = () => BUSINESS_POINTS.map((p) => p.id);

export const getAboutValues = () => VALUES;
export const getAboutImages = () => ABOUT_IMAGES;

export const getBusinessOffers = () => OFFERS;
export const getBusinessSteps = () => STEPS.map((s) => s.id);
export const getWhyPoints = () => WHY_POINTS;
export const getBusinessTypes = () => BUSINESS_TYPES;
export const getWeeklyVolumes = () => WEEKLY_VOLUMES;

export const getQuickLinks = () => QUICK_LINKS;
export const getGuideMethods = () => GUIDE_METHODS;
export const getStorageCards = () => STORAGE_CARDS;
export const getRecipes = () => RECIPES;
export const getFeaturedRecipes = () => FEATURED_RECIPE_IDS.map((id) => RECIPES.find((r) => r.id === id)).filter((r): r is Recipe => !!r);
export const getFaq = () => FAQ;

export type { NavItem, NavKey, ContactDetail, SocialLink, QuickActions, ContactCardId, ContactIcon, EnquiryType } from "@/lib/data/site";
export type { Cut, CookingMethod, CutTier } from "@/lib/data/cuts";
export type { CowPartId, CowPartGeometry } from "@/lib/data/cow-map";
export type { BrandColor } from "@/lib/data/brand";
export type { JourneyStage, JourneyStageId, ChillPointId, JourneyResultId } from "@/lib/data/journey";
export type { HeroImage, BusinessPointId } from "@/lib/data/home";
export type { AboutIcon, ValueId } from "@/lib/data/about";
export type { BusinessIcon, OfferId, StepId, WhyId, BusinessType, WeeklyVolume } from "@/lib/data/business";
export type { KnowledgeIcon, QuickLinkId, StorageId, Recipe, RecipeId, FaqId } from "@/lib/data/knowledge";
